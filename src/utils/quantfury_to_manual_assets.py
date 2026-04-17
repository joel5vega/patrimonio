import re
import pdfplumber
import pandas as pd
from pathlib import Path


# ─────────────────────────────────────────────
#  CONFIGURACIÓN
# ─────────────────────────────────────────────
PDF_PATH    = "Informe de Historial de Trading 16.04.2026.pdf"
OUTPUT_FULL = "trading_history_full.csv"   # Todos los trades
OUTPUT_POS  = "assets_ready.csv"           # Posiciones abiertas ponderadas

# Equity REAL (sin apalancamiento).
# El peso de cada posición se calcula sobre el notional total invertido
# y luego se escala al equity real para reflejar el riesgo efectivo.
EQUITY_REAL = 636   # ← cambia este valor según tu saldo actual


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def parse_num(s: str) -> float:
    """Convierte un string numérico (con $, +, comas) a float."""
    s = str(s).replace("$", "").replace("+", "").strip()
    s = re.sub(r"\s.*", "", s)          # tomar solo primer token
    if "," in s and "." in s:
        return float(s.replace(",", ""))  # 1,234.56 → 1234.56
    if "," in s:
        return float(s.replace(",", ".")) # 1,5 → 1.5 (europeo)
    return float(s)


def parse_qty(s: str) -> float:
    """Extrae la cantidad numérica al inicio de un string."""
    m = re.match(r"^([0-9,\.]+)", s.strip())
    return parse_num(m.group(1)) if m else 0.0


def extract_pnl(s: str):
    """Extrae G&P realizada de una cadena (ej: '+$3.44' o '-$12.24')."""
    m = re.search(r"([+\-]\$[0-9,\.]+)", s)
    if m:
        return parse_num(m.group(1).replace("$", ""))
    return None


# ─────────────────────────────────────────────
#  EXTRACCIÓN DE TRADES
# ─────────────────────────────────────────────
def extract_all_trades(path: str) -> list[dict]:
    """
    Lee el PDF y devuelve una lista de dicts con todos los trades,
    tanto posiciones abiertas como cerradas.
    Secciones soportadas: stock/ETF, crypto, futuros de índices.
    """
    rows = []

    with pdfplumber.open(path) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    lines = [l.strip() for l in full_text.splitlines() if l.strip()]

    section = None   # "stock" | "crypto" | "future"
    status  = None   # "open"  | "closed"

    # Regex principal: captura líneas de trade del PDF de Quantfury
    TRADE_RE = re.compile(
        r"^([A-Z0-9/]{2,12})\s+"
        r"(\d{2}/\d{2}/\d{4})\s+"
        r"(\d+:\d+:\d+\s+[AP]M\s+UTC)\s+"
        r"(COMPRAR|VENDER)\s+\(([^)]+)\)\s+"
        r"(\$?[0-9,\.]+)\s+"
        r"(.+)"
    )

    for line in lines:
        # ── Detectar sección ──────────────────────────────────
        if re.search(r"Posiciones Abiertas",   line, re.I): status  = "open";    continue
        if re.search(r"Posiciones Cerradas",   line, re.I): status  = "closed";  continue
        if re.search(r"Acciones y ETFs",       line, re.I): section = "stock";   continue
        if re.search(r"Pares de criptomonedas",line, re.I): section = "crypto";  continue
        if re.search(r"Futuros de",            line, re.I): section = "future";  continue
        if re.search(r"Informaci.n importante",line, re.I): break

        # ── Parsear línea de trade ────────────────────────────
        m = TRADE_RE.match(line)
        if not (m and section and status):
            continue

        symbol     = m.group(1)
        date       = m.group(2)
        time_str   = m.group(3)
        action     = m.group(4)
        sub_action = m.group(5)   # abrir | añadir | reducir | cerrar
        price      = parse_num(m.group(6))
        rest       = m.group(7).strip()

        side = "BUY" if action == "COMPRAR" else "SELL"
        qty  = None
        value_usd = None
        pnl = extract_pnl(rest)

        if section in ("stock", "crypto"):
            # rest: "0.1621 acciones  $60.00" | "1,173.29 HBAR  $100.00"
            parts = re.split(r"\s{2,}", rest)
            if len(parts) >= 1:
                qty = parse_qty(parts[0])
            if len(parts) >= 2:
                try:   value_usd = parse_num(parts[1])
                except: pass

        elif section == "future":
            # rest: "$100.00" | "$100.00  -$12.24"
            mv = re.match(r"(\$[0-9,\.]+)", rest)
            qty = 1.0
            if mv:
                value_usd = parse_num(mv.group(1))

        # Calcular value_usd desde price×qty si falta
        qty = qty or 0.0
        if value_usd is None and section != "future":
            value_usd = round(price * qty, 2)

        rows.append({
            "symbol":       symbol,
            "asset_type":   section,
            "status":       status,
            "date":         date,
            "time":         time_str,
            "side":         side,
            "sub_action":   sub_action,   # abrir | añadir | reducir | cerrar
            "price":        price,
            "quantity":     qty,
            "value_usd":    value_usd,    # notional USD de la operación
            "realized_pnl": pnl,          # G&P realizada (solo en ventas/cierre)
        })

    return rows


# ─────────────────────────────────────────────
#  CONSTRUCCIÓN DE POSICIONES ABIERTAS
# ─────────────────────────────────────────────
def build_open_positions(df: pd.DataFrame, equity: float) -> pd.DataFrame:
    df_open = df[df["status"] == "open"].copy()
    df_open["signed_qty"] = df_open.apply(
        lambda r: r["quantity"] if r["side"] == "BUY" else -r["quantity"], axis=1
    )

    grouped = (
        df_open.groupby(["symbol", "asset_type"], as_index=False)
        .agg(net_qty=("signed_qty", "sum"), notional=("value_usd", "sum"))
    )

    open_pos = grouped[grouped["net_qty"] > 0.0001].copy()
    notional_total = open_pos["notional"].sum()
    leverage = notional_total / equity

    open_pos["weight"]     = open_pos["notional"] / notional_total
    open_pos["amount"]     = (open_pos["weight"] * equity).round(2)
    open_pos["leverage_x"] = (open_pos["notional"] / equity).round(2)

    diff = round(equity - open_pos["amount"].sum(), 2)
    if diff != 0:
        open_pos.at[open_pos["amount"].idxmax(), "amount"] += diff

    # ✅ Columnas exactas que espera el frontend
    open_pos["name"]     = open_pos["symbol"]
    open_pos["type"]     = open_pos["asset_type"]   # ← "type", no "asset_type"
    open_pos["currency"] = "USD"
    open_pos["note"]     = f"Importado Quantfury | Leverage {leverage:.2f}x"
    open_pos["since"]    = pd.Timestamp.today().strftime("%Y-%m-%d")

    print(f"\n📊 Notional total: ${notional_total:,.2f}")
    print(f"💰 Equity real   : ${equity:,.2f}")
    print(f"⚡ Leverage      : {leverage:.2f}x\n")

    return open_pos[["name", "type", "currency", "amount", "note", "since"]]

# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────
def main():
    if not Path(PDF_PATH).exists():
        print(f"❌ Archivo no encontrado: {PDF_PATH}")
        return

    print(f"📄 Procesando: {PDF_PATH}")

    # 1. Extraer todos los trades
    rows = extract_all_trades(PDF_PATH)
    if not rows:
        print("⚠️  No se encontraron trades")
        return

    df = pd.DataFrame(rows)
    df.to_csv(OUTPUT_FULL, index=False)
    print(f"✅ Historial completo guardado: {OUTPUT_FULL}  ({len(df)} operaciones)")

    # 2. Construir posiciones abiertas ponderadas
    open_pos = build_open_positions(df, EQUITY_REAL)
    open_pos.to_csv(OUTPUT_POS, index=False)
    print(f"✅ Posiciones abiertas guardadas: {OUTPUT_POS}")

    print("\n" + open_pos.to_string(index=False))
    print(f"\n💼 Total equity asignado: ${open_pos['amount'].sum():,.2f}")


if __name__ == "__main__":
    main()