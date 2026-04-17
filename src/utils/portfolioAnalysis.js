// ─────────────────────────────────────────────────────────────
// portfolioAnalysis.js  — v4 (perfil boliviano)
// Perfil: inversor boliviano, mediano/largo plazo, ~$287 USD/mes
// Plataformas: Binance, Quantfury, AirTM DeFi (8% APR)
// ─────────────────────────────────────────────────────────────

// ─── CLASIFICACIÓN DE ACTIVOS ─────────────────────────────────
// sector: clasificación por industria/sector económico
// Sectores usados: tecnologia, salud, defensa, consumo_basico,
//   finanzas, energia, materiales, inmobiliario_cotizado,
//   bonos_gobierno, bonos_inflacion, crypto_l1, crypto_defi,
//   crypto_stablecoin, metales_preciosos, efectivo_global

const ASSET_RULES = {
  // ── ETFs Core ────────────────────────────────────────────
  VOO:   { role: 'core',        assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 2, sector: 'diversificado_eeuu'       },
  SPY:   { role: 'core',        assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 2, sector: 'diversificado_eeuu'       },

  // ── ETFs Growth ──────────────────────────────────────────
  QQQM:  { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 3, sector: 'tecnologia'               },
  QQQ:   { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 3, sector: 'tecnologia'               },
  VXUS:  { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_internacionales', horizon: 'long',   riskLevel: 3, sector: 'diversificado_global'     },
  VWO:   { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_internacionales', horizon: 'long',   riskLevel: 3, sector: 'emergentes'               },
  EMXC:  { role: 'growth',      assetClass: 'renta_variable', subClass: 'fondos_internacionales', horizon: 'long',   riskLevel: 3, sector: 'emergentes'               },
CEG: { role: 'trading', assetClass: 'renta_variable', subClass: 'acciones_individuales',
       horizon: 'short', riskLevel: 3, sector: 'energia_renovable' },
  // ── ETFs Defensivos ──────────────────────────────────────
  SCHD:  { role: 'defensive',   assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 2, sector: 'dividendos_value'         },
  VTI:   { role: 'core',        assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 2, sector: 'diversificado_eeuu'       },
  IVV:   { role: 'core',        assetClass: 'renta_variable', subClass: 'fondos_eeuu',            horizon: 'long',   riskLevel: 2, sector: 'diversificado_eeuu'       },

  // ── Renta Fija ────────────────────────────────────────────
  BND:   { role: 'defensive',   assetClass: 'renta_fija',     subClass: 'fondos_bonos',           horizon: 'long',   riskLevel: 2, sector: 'bonos_gobierno'           },
  TIP:   { role: 'defensive',   assetClass: 'renta_fija',     subClass: 'bonos_gobierno',         horizon: 'long',   riskLevel: 2, sector: 'bonos_inflacion'          },
  AGG:   { role: 'defensive',   assetClass: 'renta_fija',     subClass: 'fondos_bonos',           horizon: 'long',   riskLevel: 2, sector: 'bonos_gobierno'           },

  // ── Inmobiliario ─────────────────────────────────────────
  VNQ:   { role: 'defensive',   assetClass: 'inmobiliario',   subClass: 'reit',                   horizon: 'long',   riskLevel: 2, sector: 'inmobiliario_cotizado'    },

  // ── Metales / Commodities ─────────────────────────────────
  IAU:   { role: 'defensive',   assetClass: 'alternativos',   subClass: 'metales',                horizon: 'long',   riskLevel: 1, sector: 'metales_preciosos'        },
  GLD:   { role: 'defensive',   assetClass: 'alternativos',   subClass: 'metales',                horizon: 'long',   riskLevel: 1, sector: 'metales_preciosos'        },
  SLV:   { role: 'defensive',   assetClass: 'alternativos',   subClass: 'metales',                horizon: 'long',   riskLevel: 2, sector: 'metales_preciosos'        },
  GDX:   { role: 'growth',      assetClass: 'alternativos',   subClass: 'metales',                horizon: 'long',   riskLevel: 3, sector: 'mineria'                  },

  // ── Crypto Layer-1 ────────────────────────────────────────
  BTC:   { role: 'growth',      assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'long',   riskLevel: 3, sector: 'crypto_l1'                },
  ETH:   { role: 'growth',      assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'long',   riskLevel: 3, sector: 'crypto_l1'                },
  BNB:   { role: 'growth',      assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'long',   riskLevel: 3, sector: 'crypto_l1'                },

  // ── Crypto Speculative ────────────────────────────────────
  SOL:   { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 4, sector: 'crypto_l1'                },
  AVAX:  { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 4, sector: 'crypto_l1'                },
  ADA:   { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 5, sector: 'crypto_l1'                },
  XRP:   { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 5, sector: 'crypto_pagos'             },
  DOT:   { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 4, sector: 'crypto_l1'                },
  MATIC: { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 4, sector: 'crypto_l2'                },
  LINK:  { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 4, sector: 'crypto_defi'              },
  UNI:   { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 5, sector: 'crypto_defi'              },
  AAVE:  { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 5, sector: 'crypto_defi'              },
  DOGE:  { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'short',  riskLevel: 5, sector: 'crypto_meme'              },
  SHIB:  { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'short',  riskLevel: 5, sector: 'crypto_meme'              },
  PEPE:  { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'short',  riskLevel: 5, sector: 'crypto_meme'              },
  HBAR:  { role: 'speculative', assetClass: 'alternativos',   subClass: 'crypto',                 horizon: 'medium', riskLevel: 4, sector: 'crypto_l1'                },
POL: { role: 'speculative', assetClass: 'alternativos', subClass: 'crypto',
       horizon: 'medium', riskLevel: 4, sector: 'crypto_l2' },
  // ── Stablecoins / Liquidez ────────────────────────────────
  SGOV:  { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash_equivalent',        horizon: 'short',  riskLevel: 1, sector: 'efectivo_global'          },
  USDT:  { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1, sector: 'crypto_stablecoin'        },
  USDC:  { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1, sector: 'crypto_stablecoin'        },
  BUSD:  { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1, sector: 'crypto_stablecoin'        },
  DAI:   { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1, sector: 'crypto_stablecoin'        },
  FDUSD: { role: 'liquidity',   assetClass: 'efectivo',       subClass: 'cash',                   horizon: 'short',  riskLevel: 1, sector: 'crypto_stablecoin'        },

  // ── Acciones individuales (Quantfury / trading) ───────────
  // Tecnología
  MSFT:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  AAPL:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  GOOGL: { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  GOOG:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  META:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  AMZN:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  NVDA:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'tecnologia'               },
  TSLA:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'tecnologia'               },
  AMD:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'tecnologia'               },
  INTC:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  CRM:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  ORCL:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  ADBE:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  NFLX:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  PYPL:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },
  SNOW:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'tecnologia'               },
  PLTR:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'tecnologia'               },
  UBER:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'tecnologia'               },

  // Salud y biotecnología
  JNJ:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'salud'                    },
  UNH:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'salud'                    },
  PFE:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'salud'                    },
  ABBV:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'salud'                    },
  MRK:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'salud'                    },
  MRNA:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'salud'                    },
  BNTX:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'salud'                    },
  ISRG:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'salud'                    },
  ABT:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'salud'                    },

  // Defensa y aeroespacial
  LMT:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'defensa'                  },
  RTX:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'defensa'                  },
  NOC:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'defensa'                  },
  GD:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'defensa'                  },
  BA:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'defensa'                  },
  KTOS:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'defensa'                  },

  // Finanzas y bancos
  JPM:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'finanzas'                 },
  BAC:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'finanzas'                 },
  GS:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'finanzas'                 },
  MS:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'finanzas'                 },
  V:     { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'finanzas'                 },
  MA:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'finanzas'                 },
  BRK_B: { role: 'trading',    assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'finanzas'                 },
  COIN:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'finanzas'                 },

  // Energía
  XOM:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'energia'                  },
  CVX:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'energia'                  },
  COP:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'energia'                  },
  NEE:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'energia_renovable'        },
  ENPH:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 4, sector: 'energia_renovable'        },

  // Consumo básico y alimentos
  KO:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 1, sector: 'consumo_basico'           },
  PG:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 1, sector: 'consumo_basico'           },
  PEP:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 1, sector: 'consumo_basico'           },
  WMT:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 1, sector: 'consumo_basico'           },
  COST:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'consumo_basico'           },
  MCD:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 1, sector: 'consumo_basico'           },

  // Consumo discrecional
  AMZN_CONS: { role: 'trading', assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'consumo_discrecional'     },
  NKE:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'consumo_discrecional'     },
  SBUX:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'consumo_discrecional'     },
  DIS:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'consumo_discrecional'     },
  LULU:  { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'consumo_discrecional'     },

  // Materiales e industria
  CAT:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'materiales'               },
  DE:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'materiales'               },
  FCX:   { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 3, sector: 'materiales'               },

  // Telecomunicaciones
  VZ:    { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'telecomunicaciones'       },
  T:     { role: 'trading',     assetClass: 'renta_variable', subClass: 'acciones_individuales',  horizon: 'short',  riskLevel: 2, sector: 'telecomunicaciones'       },
};

// Claves en lowercase para lookup case-insensitive.
// Flags:
//   isInvestable: false       → excluido del denominador investableUSD y del rebalanceo
//   isLocked: true            → muestra candado en UI
//   isLocalPrivateEquity:true → apaga alerta noPrivateEquity (SAFI = PE local boliviano)
//   isDeFi + aprPct           → retorno real conocido, sobreescribe RETURN_ASSUMPTIONS
export const MANUAL_RULES = {
  'airtm': {
    role:                'yield',
    assetClass:          'efectivo',
    subClass:            'cash_equivalent',
    horizon:             'short',
    riskLevel:           2,
    isLocked:            false,
    isInvestable:        true,
    isDeFi:              true,   // posición DeFi real
    aprPct:              8,      // 8% APR confirmado por el usuario
  },
  'safi': {
    role:                'reserve',
    assetClass:          'efectivo',
    subClass:            'cash_local',
    horizon:             'medium',
    riskLevel:           2,
    isLocked:            true,
    isInvestable:        false,
    isLocalPrivateEquity: true,  // SAFI = private equity local → apaga alerta
  },
  'ahorro $': {
    role:                'reserve',
    assetClass:          'efectivo',
    subClass:            'cash_fisico',
    horizon:             'medium',
    riskLevel:           1,
    isLocked:            true,
    isInvestable:        false,
  },
  // FIX: Ahorro en Bs es para evento futuro → reserve (no liquidity)
  'ahorro en bs': {
    role:                'reserve',
    assetClass:          'efectivo',
    subClass:            'cash_local',
    horizon:             'medium',
    riskLevel:           1,
    isLocked:            true,
    isInvestable:        false,
  },
  'ahorro bs': {
    role:                'reserve',
    assetClass:          'efectivo',
    subClass:            'cash_local',
    horizon:             'medium',
    riskLevel:           1,
    isLocked:            true,
    isInvestable:        false,
  },
  't ach':       { role: 'patrimony', assetClass: 'inmobiliario', subClass: 'propiedad_fisica', horizon: 'very_long', riskLevel: 2 },
  't sas':       { role: 'patrimony', assetClass: 'inmobiliario', subClass: 'propiedad_fisica', horizon: 'very_long', riskLevel: 2 },
  't achacachi': { role: 'patrimony', assetClass: 'inmobiliario', subClass: 'propiedad_fisica', horizon: 'very_long', riskLevel: 2 },
};

// ─── SUPUESTOS DE RETORNO ─────────────────────────────────────
// AirTM DeFi usa aprPct directamente (sobreescrito en buildPortfolioV3)
const RETURN_ASSUMPTIONS = {
  renta_variable:  0.08,
  alternativos:    0.10,
  inmobiliario:    0.05,
  private_equity:  0.12,
  renta_fija:      0.03,
  efectivo:        0.03,
  cash_equivalent: 0.03,  // genérico; DeFi sobreescribe por activo
  equity:          0.08,
  crypto:          0.12,
  fixed_income:    0.03,
  cash:            0.02,
  commodity:       0.04,
  real_asset:      0.04,
  real_estate:     0.05,
};

// ─── THRESHOLDS ───────────────────────────────────────────────
// Ajustados para perfil boliviano, mediano/largo plazo
const THRESHOLDS = {
  minCashPct:        5,   // alerta lowCash (USDT puro < 5% = crítico)
  cashRetentionPct:  10,  // buffer mínimo para deployableCash
  maxCashPct:        35,
  maxSpeculativePct:  5,
  coreMinPct:        30,
  maxTradingPct:     12,
};

// ─── TARGETS POR ROL ─────────────────────────────────────────
// % sobre portafolio INVERTIBLE (excluye reserve + patrimony).
// Perfil: boliviano, largo plazo, trading controlado, DeFi yield como pilar.
export const PORTFOLIO_TARGETS = {
  core:        35,  // VOO / SPY
  growth:      20,  // QQQM, BTC, ETH, VXUS
  defensive:   15,  // IAU, BND
  liquidity:    5,  // USDT operativo mínimo
  yield:       15,  // AirTM DeFi 8% — pilar de ingreso pasivo
  speculative:  3,  // altcoins — cap duro
  trading:      7,  // Quantfury — cap duro
};

// ─── HELPERS ─────────────────────────────────────────────────

function classifyAsset(name, type, groupKey, symbol) {
  const symKey = (symbol || '').toUpperCase().trim().split('/')[0];
  if (symKey && ASSET_RULES[symKey]) return ASSET_RULES[symKey];

  const nameLower = (name || '').toLowerCase().trim();
  if (nameLower && MANUAL_RULES[nameLower]) return MANUAL_RULES[nameLower];

  if (type === 'crypto' && groupKey === 'quantfury')
  return { role: 'speculative', assetClass: 'alternativos', subClass: 'crypto', horizon: 'short', riskLevel: 5 };

if (type === 'stock') return groupKey === 'quantfury'
  ? { role: 'trading',  assetClass: 'renta_variable', subClass: 'acciones_individuales', horizon: 'short', riskLevel: 4 }
  : { role: 'growth',   assetClass: 'renta_variable', subClass: 'acciones_individuales', horizon: 'long',  riskLevel: 3 };
if (type === 'etf')    return { role: 'growth',    assetClass: 'renta_variable', subClass: 'fondos_eeuu', horizon: 'long',  riskLevel: 3 };
if (type === 'crypto') return { role: 'growth',    assetClass: 'alternativos',   subClass: 'crypto',      horizon: 'long',  riskLevel: 4 };
  return                        { role: 'liquidity', assetClass: 'efectivo',       subClass: 'cash',        horizon: 'short', riskLevel: 2 };
}

function buildStrategy(role, _name, { speculativePct, cashPct, tradingPct }) {
  const base = {
    core:        { accumulate: true,  hold: true,  reduce: false, useForTrading: false },
    growth:      { accumulate: true,  hold: true,  reduce: false, useForTrading: false },
    defensive:   { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    liquidity:   { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    yield:       { accumulate: true,  hold: true,  reduce: false, useForTrading: false }, // acumular DeFi
    speculative: { accumulate: false, hold: false, reduce: false, useForTrading: false },
    trading:     { accumulate: false, hold: false, reduce: false, useForTrading: true  },
    reserve:     { accumulate: false, hold: true,  reduce: false, useForTrading: false },
    patrimony:   { accumulate: false, hold: true,  reduce: false, useForTrading: false },
  };

  const strat = { ...(base[role] || base.liquidity) };
  if (role === 'liquidity')   strat.reduce = cashPct        > THRESHOLDS.maxCashPct;
  if (role === 'speculative') strat.reduce = speculativePct > THRESHOLDS.maxSpeculativePct;
  if (role === 'trading')     strat.reduce = tradingPct     > THRESHOLDS.maxTradingPct;

  return strat;
}

// ─── PLAN DE REBALANCEO ───────────────────────────────────────
// Genera dos planes:
//   monthly  → qué comprar este mes con el ingreso disponible (~$287)
//   lumpSum  → cash deployable por encima del mínimo operativo
function buildRebalancePlan({
  portfolioAssets,
  byRolePct,
  investableUSD,
  monthlyUSD,
  investableCashUSD,   // ← recibe el cash ya filtrado (sin DeFi)
}) {
  const deficits = Object.entries(PORTFOLIO_TARGETS)
    .map(([role, target]) => ({
      role, target,
      current: byRolePct[role] || 0,
      diff:    target - (byRolePct[role] || 0),
    }))
    .filter(d => d.diff > 0)
    .sort((a, b) => b.diff - a.diff);

  const totalDeficit = deficits.reduce((s, d) => s + d.diff, 0) || 1;

  const assetsByRole = portfolioAssets.reduce((acc, a) => {
    (acc[a.classification.role] = acc[a.classification.role] || []).push(a);
    return acc;
  }, {});

  // ── Plan mensual ──
  const monthlyActions = [];
  let monthlyBudget = monthlyUSD;

  for (const d of deficits) {
    if (monthlyBudget <= 0) break;
    const share  = (d.diff / totalDeficit) * monthlyUSD;
    const invest = Math.min(share, monthlyBudget);
    if (invest < 15) continue;

    const candidates = (assetsByRole[d.role] || [])
      .filter(a => a.classification.isInvestable !== false)
      .sort((a, b) => a.weightPct - b.weightPct);
    if (!candidates.length) continue;

    monthlyActions.push({
      action:         'BUY',
      asset:          candidates[0].symbol || candidates[0].name,
      amountUSD:      Number(invest.toFixed(2)),
      reason:         `${d.role} underweight (${d.current.toFixed(1)}% → ${d.target}%)`,
      monthsToTarget: invest > 0
        ? Math.ceil((d.diff / 100 * investableUSD) / invest)
        : null,
    });
    monthlyBudget -= invest;
  }

  // ── Plan lump-sum: usa investableCashUSD recibido (sin AirTM) ──
  const minOperativeCash = investableUSD * (THRESHOLDS.cashRetentionPct / 100);
  const deployableCash   = Math.max(0, investableCashUSD - minOperativeCash);
  const lumpSumActions   = [];

  if (deployableCash > 100) {
    let budget = deployableCash;
    for (const d of deficits) {
      if (budget <= 0) break;
      const share  = (d.diff / totalDeficit) * deployableCash;
      const invest = Math.min(share, budget);
      if (invest < 50) continue;

      const candidates = (assetsByRole[d.role] || [])
        .filter(a => a.classification.isInvestable !== false)
        .sort((a, b) => a.weightPct - b.weightPct);
      if (!candidates.length) continue;

      lumpSumActions.push({
        action:    'BUY',
        asset:     candidates[0].symbol || candidates[0].name,
        amountUSD: Number(invest.toFixed(2)),
        reason:    `${d.role} underweight — deploy cash disponible`,
      });
      budget -= invest;
    }
  }

  return {
    remainingCash:  Number(minOperativeCash.toFixed(2)),
    deployableCash: Number(deployableCash.toFixed(2)),
    monthlyUSD,
    monthly:  monthlyActions,
    lumpSum:  lumpSumActions,
    actions:  lumpSumActions.length > 0 ? lumpSumActions : monthlyActions,
  };
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────

export function buildPortfolioV3(input) {
  const {
    allAssets     = [],
    totalUSD      = 0,
    reservedBUY   = 0,
    pendingSELL   = 0,
    grossExposure = 0,
    monthlyUSD    = 287,  // 2000 Bs / 6.96 — configurable desde AppContext
  } = input;

  // 1. Enriquecer
  const enriched = allAssets.map(a => {
    const cls    = classifyAsset(a.name, a.type, a.groupKey, a.symbol);
    const weight = totalUSD > 0 ? (a.valueUSD / totalUSD) * 100 : 0;
    return {
      ...a,
      valueUSD:       Number((a.valueUSD || 0).toFixed(2)),
      weightPct:      Number(weight.toFixed(2)),
      classification: cls,
    };
  });

  // 2. Separar capas
  const patrimonyAssets = enriched.filter(a => a.classification.role === 'patrimony');
  const reserveAssets   = enriched.filter(a => a.classification.role === 'reserve');
  const portfolioAssets = enriched.filter(a =>
    a.classification.role !== 'patrimony' &&
    a.classification.role !== 'reserve'
  );

  const patrimonyUSD  = patrimonyAssets.reduce((s, a) => s + a.valueUSD, 0);
  const reserveUSD    = reserveAssets.reduce((s, a) => s + a.valueUSD, 0);
  const investableUSD = totalUSD - patrimonyUSD - reserveUSD;

  // 3. Distribuciones (% sobre investableUSD)
  const byRoleUSD = {};
  portfolioAssets.forEach(a => {
    byRoleUSD[a.classification.role] = (byRoleUSD[a.classification.role] || 0) + a.valueUSD;
  });
  const byRolePct = {};
  Object.entries(byRoleUSD).forEach(([r, v]) => {
    byRolePct[r] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  const byClassUSD = {};
  portfolioAssets.forEach(a => {
    byClassUSD[a.classification.assetClass] = (byClassUSD[a.classification.assetClass] || 0) + a.valueUSD;
  });
  const byClassPct = {};
  Object.entries(byClassUSD).forEach(([k, v]) => {
    byClassPct[k] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  const bySubClassUSD = {};
  portfolioAssets.forEach(a => {
    const key = `${a.classification.assetClass}__${a.classification.subClass || 'otros'}`;
    bySubClassUSD[key] = (bySubClassUSD[key] || 0) + a.valueUSD;
  });
  const bySubClassPct = {};
  Object.entries(bySubClassUSD).forEach(([k, v]) => {
    bySubClassPct[k] = investableUSD > 0 ? (v / investableUSD) * 100 : 0;
  });

  // 4. Cash operativo (solo efectivo investable)
  const investableCashUSD = portfolioAssets
  .filter(a =>
    a.classification.assetClass === 'efectivo' &&
    a.classification.isInvestable !== false &&
    !(a.classification.isDeFi && (a.classification.aprPct || 0) > 0)   // excluir yield-bearing cash
  )
  .reduce((s, a) => s + a.valueUSD, 0);


  const speculativePct = byRolePct.speculative || 0;
  const tradingPct     = byRolePct.trading      || 0;
  const corePct        = byRolePct.core         || 0;
  const cashPct        = investableUSD > 0 ? (investableCashUSD / investableUSD) * 100 : 0;

  // 5. Estrategias
  const assets = enriched.map(a => ({
    ...a,
    strategy: buildStrategy(a.classification.role, a.name, { speculativePct, cashPct, tradingPct }),
  }));

  // 6. Métricas — AirTM DeFi usa aprPct real
  const portfolioRisk = portfolioAssets.reduce((sum, a) => {
    const w = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    return sum + w * a.classification.riskLevel;
  }, 0);

  const expectedReturn = portfolioAssets.reduce((sum, a) => {
    const w   = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    const ret = (a.classification.isDeFi && a.classification.aprPct)
      ? a.classification.aprPct / 100
      : (RETURN_ASSUMPTIONS[a.classification.assetClass] || 0.05);
    return sum + w * ret;
  }, 0);

  const cashDrag = (cashPct / 100) * Math.max(0, expectedReturn - 0.02);

  const hhi = portfolioAssets.reduce((sum, a) => {
    const w = investableUSD > 0 ? a.valueUSD / investableUSD : 0;
    return sum + w * w;
  }, 0);

  // 7. Alertas
  const hasLocalPE = enriched.some(a => a.classification.isLocalPrivateEquity);
  const alerts = {
    lowCash:            cashPct        < THRESHOLDS.minCashPct,
    overCash:           cashPct        > THRESHOLDS.maxCashPct,
    underCore:          corePct        < THRESHOLDS.coreMinPct,
    overSpeculative:    speculativePct > THRESHOLDS.maxSpeculativePct,
    excessTrading:      tradingPct     > THRESHOLDS.maxTradingPct,
    highRisk:           portfolioRisk  > 3.5,
    lowDiversification: hhi            > 0.25,
    noPrivateEquity:    !hasLocalPE && !(byClassPct['private_equity'] > 0),
  };

  // 8. Reglas
  const rules = [];
  if (alerts.underCore)       rules.push('UNDER CORE → comprar VOO este mes');
  if (alerts.overCash)        rules.push('EXCESS CASH → desplegar en core/growth progresivamente');
  if (alerts.overSpeculative) rules.push('REDUCE ALTCOINS → mantener bajo el 5%');
  if (alerts.excessTrading)   rules.push('REDUCE TRADING → más del 12% en Quantfury');
  if (alerts.highRisk)        rules.push('REDUCIR RIESGO global → rotar a core/defensive');
  if (alerts.noPrivateEquity) rules.push('SIN PRIVATE EQUITY → considerar fondos SAFI o participación directa');
  if (!rules.length)          rules.push('Portfolio balanceado ✓');

  // 9. Rebalanceo
  const rebalance = buildRebalancePlan({ portfolioAssets, byRolePct, investableUSD, monthlyUSD ,investableCashUSD});

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      totalUSD,
      investableUSD,
      patrimonyUSD,
      reserveUSD,           // nuevo: reservas separadas del invertible
    },
    portfolio: {
      byRole:       byRolePct,
      byAssetClass: byClassPct,
      bySubClass:   bySubClassPct,
    },
    patrimony: {
      totalUSD:  patrimonyUSD,
      byClass:   patrimonyAssets.reduce((acc, a) => {
        acc[a.classification.assetClass] = (acc[a.classification.assetClass] || 0) + a.valueUSD;
        return acc;
      }, {}),
      assets: patrimonyAssets,
    },
    reserves: {
      totalUSD: reserveUSD,
      assets:   reserveAssets,
      note:     'No invertibles en bolsa. Se mantienen hasta cambio de condiciones.',
    },
    risk: {
      portfolioRisk:  Number(portfolioRisk.toFixed(2)),
      expectedReturn: Number((expectedReturn * 100).toFixed(2)),
      cashDrag:       Number(cashDrag.toFixed(4)),
      hhi:            Number(hhi.toFixed(4)),
    },
    trading:        { reservedBUY, pendingSELL, grossExposure },
    alerts,
    ruleEvaluation: rules,
    rebalancePlan:  rebalance,
    assets,
  };
}
