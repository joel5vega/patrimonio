import re
import pdfplumber
import pandas as pd
from pathlib import Path

PDF_PATH = "Informe de Historial de Trading 06.04.2026.pdf"
OUTPUT_CSV = "manual_assets_from_quantfury.csv"
DEBUG = True

EQUITY_TOTAL = 530.76

PNL_MAP = {
    "SMCI": -0.64,
    "KTOS": 0.32,
    "MELI": -0.07,
    "VXJ6": -1.45,
    "JNJ": -0.68,
    "MRNA": -2.56,
    "CEG": -3.09,
    "GLD": 2.68,
    "MSFT": 0.33,
}

STOCK_RE = re.compile(
    r"^([A-Z]{1,6})\s+"
    r"\d{2}/\d{2}/\d{4}\s+\d+:\d+:\d+\s+[AP]M\s+UTC\s+"
    r"(COMPRAR|VENDER)\s+\([^)]+\)\s+"
    r"\$([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)\s+"
    r"([0-9]+[.,][0-9]+)\s+acciones\s+"
    r"\$([0-9]+(?:\.[0-9]+)?)",
    re.IGNORECASE,
)

FUTURE_RE = re.compile(
    r"^([A-Z0-9]{2,6})\s+"
    r"\d{2}/\d{2}/\d{4}\s+\d+:\d+:\d+\s+[AP]M\s+UTC\s+"
    r"(COMPRAR|VENDER)\s+\([^)]+\)\s+"
    r"([0-9]+(?:\.[0-9]+)?)\s+"
    r"\$([0-9]+(?:\.[0-9]+)?)",
    re.IGNORECASE,
)

def parse_num(s: str) -> float:
    s = s.strip().replace("$", "")
    if "." in s and "," in s:
        return float(s.replace(",", ""))
    if "," in s:
        return float(s.replace(",", "."))
    return float(s)

def extract_positions(path: str) -> list:
    rows = []

    with pdfplumber.open(path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            lines = [l.strip() for l in text.splitlines() if l.strip()]

            if DEBUG:
                print(f"\n===== PAGE {page_num} =====")
                for i, l in enumerate(lines):
                    print(f"{i:03d}: {l}")

            section = "stocks"

            for line in lines:
                if "futuros de" in line.lower() and "ndices" in line.lower():
                    section = "futures"
                    continue

                if "acciones y etf" in line.lower():
                    section = "stocks"
                    continue

                if section == "stocks":
                    m = STOCK_RE.match(line)
                    if not m:
                        continue

                    symbol = m.group(1).upper()
                    side = "BUY" if "COMPRAR" in m.group(2).upper() else "SELL"
                    price = parse_num(m.group(3))
                    quantity = parse_num(m.group(4))
                    asset_type = "stock"

                else:
                    m = FUTURE_RE.match(line)
                    if not m:
                        continue

                    symbol = m.group(1).upper()
                    side = "BUY" if "COMPRAR" in m.group(2).upper() else "SELL"
                    price = parse_num(m.group(3))
                    quantity = 1.0
                    asset_type = "future"

                signed_qty = quantity if side == "BUY" else -quantity

                row = {
                    "symbol": symbol,
                    "side": side,
                    "price": price,
                    "quantity": quantity,
                    "signed_qty": signed_qty,
                    "pxq": price * quantity,
                    "asset_type": asset_type,
                }
                rows.append(row)

                if DEBUG:
                    print(f"[OK] {row}")

    return rows

def consolidate(rows: list) -> list:
    if not rows:
        return []

    df = pd.DataFrame(rows)

    consolidated = (
        df.groupby(["symbol", "asset_type"], as_index=False)
        .agg(
            net_quantity=("signed_qty", "sum"),
            total_qty=("quantity", "sum"),
            total_pxq=("pxq", "sum"),
            trades=("side", "count"),
        )
    )

    open_pos = consolidated[consolidated["net_quantity"] > 0.00001].copy()
    open_pos["avg_price"] = (open_pos["total_pxq"] / open_pos["total_qty"]).round(4)
    open_pos["vwap_value"] = (open_pos["net_quantity"] * open_pos["avg_price"]).round(2)
    open_pos["net_quantity"] = open_pos["net_quantity"].round(6)

    return open_pos.to_dict("records")

def build_manual_assets():
    if not Path(PDF_PATH).exists():
        print(f"[ERROR] No se encontró: {PDF_PATH}")
        return

    rows = extract_positions(PDF_PATH)
    if not rows:
        print("No se encontraron posiciones.")
        return

    positions = consolidate(rows)
    if not positions:
        print("No hay posiciones abiertas netas.")
        return

    df = pd.DataFrame(positions)

    total_vwap = df["vwap_value"].sum()
    df["weight"] = df["vwap_value"] / total_vwap
    df["amount"] = (df["weight"] * EQUITY_TOTAL).round(2)
    df["pnl_actual"] = df["symbol"].map(PNL_MAP).fillna(0.0)

    residuo = round(EQUITY_TOTAL - df["amount"].sum(), 2)
    if residuo != 0:
        idx_max = df["amount"].idxmax()
        df.at[idx_max, "amount"] += residuo

    df["name"] = df["symbol"]
    df["type"] = df["asset_type"].apply(lambda t: "future" if t == "future" else "stock")
    df["currency"] = "USD"
    df["quantity"] = df["net_quantity"]
    df["note"] = "Importado [quantfury]"
    df["since"] = ""

    out = df[["name", "type", "currency", "amount", "avg_price", "quantity", "pnl_actual", "note", "since"]]
    out.to_csv(OUTPUT_CSV, index=False)

    print(f"\n✅ {OUTPUT_CSV} generado")
    print(f"Total final: ${out['amount'].sum():.2f}")

if __name__ == "__main__":
    build_manual_assets()