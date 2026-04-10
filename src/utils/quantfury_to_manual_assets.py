import re
import pdfplumber
import pandas as pd
from pathlib import Path

PDF_PATH = "Informe de Historial de Trading 09.04.2026.pdf"
OUTPUT_CSV = "assets_ready.csv"

EQUITY_TOTAL = 542.44


STOCK_RE = re.compile(
    r"^([A-Z]{1,6})\s+"
    r"(\d{2}/\d{2}/\d{4})\s+"
    r"(\d+:\d+:\d+)\s+[AP]M\s+UTC\s+"
    r"(COMPRAR|VENDER)\s+\([^)]+\)\s+"
    r"\$([0-9,\.]+)\s+"
    r"([0-9\.,]+)\s+acciones\s+"
    r"\$([0-9\.]+)"
)

FUTURE_RE = re.compile(
    r"^([A-Z0-9]{2,6})\s+"
    r"(\d{2}/\d{2}/\d{4})\s+"
    r"(\d+:\d+:\d+)\s+[AP]M\s+UTC\s+"
    r"(COMPRAR|VENDER)\s+\([^)]+\)\s+"
    r"([0-9\.]+)\s+"
    r"\$([0-9\.]+)"
)

def parse_num(s: str) -> float:
    s = s.replace("$", "").strip()

    if "," in s and "." in s:
        return float(s.replace(",", ""))
    if "," in s:
        return float(s.replace(",", "."))
    return float(s)

def extract_trades(path: str):
    rows = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            lines = [l.strip() for l in text.splitlines() if l.strip()]

            section = "stocks"

            for line in lines:

                if "futuros de" in line.lower():
                    section = "futures"
                    continue

                if "acciones y etf" in line.lower():
                    section = "stocks"
                    continue

                if section == "stocks":
                    m = STOCK_RE.match(line)
                    if not m:
                        continue

                    symbol = m.group(1)
                    side = "BUY" if m.group(4) == "COMPRAR" else "SELL"
                    price = parse_num(m.group(5))
                    quantity = parse_num(m.group(6))
                    asset_type = "stock"

                else:
                    m = FUTURE_RE.match(line)
                    if not m:
                        continue

                    symbol = m.group(1)
                    side = "BUY" if m.group(4) == "COMPRAR" else "SELL"
                    price = parse_num(m.group(5))
                    quantity = 1.0
                    asset_type = "future"

                signed_qty = quantity if side == "BUY" else -quantity

                rows.append({
                    "symbol": symbol,
                    "asset_type": asset_type,
                    "signed_qty": signed_qty,
                    "pxq": price * quantity,
                })

    return rows

def build_assets(rows):
    df = pd.DataFrame(rows)

    grouped = (
        df.groupby(["symbol", "asset_type"], as_index=False)
        .agg(
            net_qty=("signed_qty", "sum"),
            total_pxq=("pxq", "sum"),
        )
    )

    # Solo posiciones abiertas
    open_pos = grouped[grouped["net_qty"] > 0.0001].copy()

    total_notional = open_pos["total_pxq"].sum()

    open_pos["weight"] = open_pos["total_pxq"] / total_notional
    open_pos["amount"] = (open_pos["weight"] * EQUITY_TOTAL).round(2)

    # 🔥 FORMATO FINAL REQUERIDO
    open_pos["name"] = open_pos["symbol"]
    open_pos["currency"] = "USD"
    open_pos["note"] = "Importado Quantfury"
    open_pos["since"] = ""

    # Ajuste de redondeo
    diff = round(EQUITY_TOTAL - open_pos["amount"].sum(), 2)
    if diff != 0:
        idx = open_pos["amount"].idxmax()
        open_pos.at[idx, "amount"] += diff

    return open_pos[["name", "currency", "amount", "note", "since"]]

def main():
    if not Path(PDF_PATH).exists():
        print("Archivo no encontrado")
        return

    rows = extract_trades(PDF_PATH)

    if not rows:
        print("No trades encontrados")
        return

    assets = build_assets(rows)

    assets.to_csv(OUTPUT_CSV, index=False)

    print("✅ CSV listo:", OUTPUT_CSV)
    print("💰 Total:", assets["amount"].sum())

if __name__ == "__main__":
    main()