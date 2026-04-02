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
                if "COMPRAR" not in line.upper() and "VENDER" not in line.upper():
                    continue

                # Ejemplo real:
                # MSFT 25/03/2026 6:34:18 PM UTC COMPRAR (abrir) $370.22 0.1621 acciones $60.00
                m = re.match(
                    r"^([A-Z]{2,6})\s+.*?\$([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s+acciones\s+\$([0-9]+(?:\.[0-9]+)?)$",
                    line,
                    re.IGNORECASE,
                )

                if not m:
                    if DEBUG:
                        print(f"[DEBUG] No hizo match: {line}")
                    continue

                symbol = m.group(1).strip()
                price = float(m.group(2))
                quantity = float(m.group(3))
                value = float(m.group(4))

                row = {
                    "symbol": symbol,
                    "price": price,
                    "quantity": quantity,
                    "value": value,
                }
                rows.append(row)

                if DEBUG:
                    print(f"[DEBUG] Fila agregada: {row}")

    unique = []
    seen = set()
    for r in rows:
        key = (r["symbol"], r["price"], r["quantity"], r["value"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    if DEBUG:
        print("\n===== FILAS ÚNICAS =====")
        for r in unique:
            print(r)

    return unique

def build_manual_assets():
    positions = extract_positions_from_pdf(PDF_PATH)

    if not positions:
        print("\nNo se encontraron posiciones en el PDF.")
        return

    df = pd.DataFrame(positions)
    df["name"] = df["symbol"]
    df["type"] = "stock"
    df["currency"] = "USD"
    df["amount"] = df["value"].round(2)
    df["note"] = "Importado [quantfury]"
    df["since"] = ""

    out = df[["name", "type", "currency", "amount", "note", "since"]]
    out.to_csv(OUTPUT_CSV, index=False)

    print(f"\nGenerado {OUTPUT_CSV} con {len(out)} activos.")
    print(out.to_string(index=False))

if __name__ == "__main__":
    build_manual_assets()