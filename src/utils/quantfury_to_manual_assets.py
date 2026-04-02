import re
import pdfplumber
import pandas as pd

PDF_PATH = "Informe de Historial de Trading 02.04.2026.pdf"
OUTPUT_CSV = "manual_assets_from_quantfury.csv"
DEBUG = True


def extract_positions_from_pdf(path):
    rows = []

    with pdfplumber.open(path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            lines = [line.strip() for line in text.splitlines() if line.strip()]

            if DEBUG:
                print(f"\n===== PAGE {page_num} =====")
                for idx, line in enumerate(lines):
                    print(f"{idx:03d}: {line}")

            for line in lines:
                if "acciones" not in line.lower():
                    continue

                is_buy  = "COMPRAR" in line.upper()
                is_sell = "VENDER"  in line.upper()

                if not is_buy and not is_sell:
                    continue

                m = re.match(
                    r"^([A-Z]{2,6})\s+.*?\$([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s+acciones\s+\$([0-9]+(?:\.[0-9]+)?)$",
                    line,
                    re.IGNORECASE,
                )

                if not m:
                    if DEBUG:
                        print(f"[DEBUG] No hizo match: {line}")
                    continue

                symbol   = m.group(1).strip()
                price    = float(m.group(2))
                quantity = float(m.group(3))
                value    = float(m.group(4))
                side     = "BUY" if is_buy else "SELL"

                # SELL invierte el signo
                signed_qty   = quantity if side == "BUY" else -quantity
                signed_value = value    if side == "BUY" else -value

                row = {
                    "symbol":       symbol,
                    "price":        price,
                    "quantity":     quantity,
                    "signed_qty":   signed_qty,
                    "signed_value": signed_value,
                    "value":        value,
                    "side":         side,
                }
                rows.append(row)

                if DEBUG:
                    print(f"[DEBUG] Fila agregada: {row}")

    return rows


def consolidate_positions(rows):
    """Suma/resta posiciones del mismo símbolo y devuelve posiciones netas abiertas."""
    if not rows:
        return []

    df = pd.DataFrame(rows)

    consolidated = (
        df.groupby("symbol", as_index=False)
        .agg(
            net_quantity=("signed_qty",   "sum"),
            net_value=   ("signed_value", "sum"),
            last_price=  ("price",        "last"),
            trades=      ("side",         "count"),
        )
    )

    # Solo posiciones abiertas (cantidad neta positiva)
    open_positions = consolidated[consolidated["net_quantity"] > 0.00001].copy()
    open_positions["net_value"] = open_positions["net_value"].round(2)
    open_positions["net_quantity"] = open_positions["net_quantity"].round(6)

    if DEBUG:
        print("\n===== POSICIONES CONSOLIDADAS =====")
        print(open_positions.to_string(index=False))

    return open_positions.to_dict("records")


def build_manual_assets():
    rows = extract_positions_from_pdf(PDF_PATH)

    if not rows:
        print("\nNo se encontraron posiciones en el PDF.")
        return

    positions = consolidate_positions(rows)

    if not positions:
        print("\nNo hay posiciones abiertas netas.")
        return

    df = pd.DataFrame(positions)
    df["name"]     = df["symbol"]
    df["type"]     = "stock"
    df["currency"] = "USD"
    df["amount"]   = df["net_value"].round(2)
    df["note"]     = "Importado [quantfury]"
    df["since"]    = ""

    out = df[["name", "type", "currency", "amount", "note", "since"]]
    out.to_csv(OUTPUT_CSV, index=False)

    print(f"\nGenerado {OUTPUT_CSV} con {len(out)} activos.")
    print(out.to_string(index=False))


if __name__ == "__main__":
    build_manual_assets()