from firebase_functions import https_fn, options
import pdfplumber
import pandas as pd
import re
import json
import io

# Permite peticiones desde tu GitHub Pages
@https_fn.on_request(cors=options.CorsOptions(cors_origins=["*"], cors_methods=["POST"]))
def procesar_quantfury(req: https_fn.Request) -> https_fn.Response:
    # 1. Obtener el Equity
    equity_str = req.form.get("equity")
    if not equity_str:
        return https_fn.Response("Falta el valor de Equity", status=400)
    
    equity_real = float(equity_str)

    # 2. Obtener el PDF
    pdf_file = req.files.get("pdf")
    if not pdf_file:
        return https_fn.Response("No se proporcionó ningún PDF", status=400)

    try:
        # 3. Leer el PDF desde la memoria (sin guardarlo en disco)
        rows = []
        with pdfplumber.open(pdf_file) as pdf:
            full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        
        # --- AQUÍ PEGAS TUS FUNCIONES EXACTAMENTE COMO LAS TIENES ---
        # (parse_num, parse_qty, extract_pnl, extract_all_trades modificada para recibir el texto)
        
        # Ejemplo rápido de la lógica central adaptada:
        lines = [l.strip() for l in full_text.splitlines() if l.strip()]
        
        # ... (Tu bucle for line in lines que llena 'rows') ...
        
        # 4. Procesar DataFrame
        df = pd.DataFrame(rows)
        # Asegúrate de incluir tu función build_open_positions en este archivo
        open_pos = build_open_positions(df, equity_real)
        
        # 5. Retornar el resultado como JSON
        resultado_json = open_pos.to_dict(orient="records")
        return https_fn.Response(
            json.dumps(resultado_json), 
            mimetype="application/json"
        )

    except Exception as e:
        return https_fn.Response(f"Error procesando el PDF: {str(e)}", status=500)