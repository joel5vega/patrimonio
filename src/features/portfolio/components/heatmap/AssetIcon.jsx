import React, { useState } from 'react';
import {
  SI_SLUGS,
  SI_COLORS,
  resolveIconLucide,
  getIconSymbol,
} from './assetMeta';

const US_FLAG_SYMBOLS = new Set([
  'VOO', 'SPY', 'IVV', 'VTI', 'QQQ', 'QQQM', 'DIA', 'IWM',
]);

// Símbolos donde Simple Icons se ve mal → ir directo a DeBounce
const SKIP_SI = new Set(['005930', '005930.KS', 'SSNLF', 'SAMSUNG']);

const LOGO_DOMAINS = {
  // Plataformas
  BYBIT: 'bybit.com',
  AIRTM: 'airtm.com',
  DEEL: 'deel.com',
  BINANCE: 'binance.com',

  // Tech / growth
  PLTR: 'palantir.com',
  MU: 'micron.com',
  AMZN: 'amazon.com',
  MSFT: 'microsoft.com',
  MELI: 'mercadolibre.com',
  ASML: 'asml.com',
  TSM: 'tsmc.com',
  NVDA: 'nvidia.com',
  AAPL: 'apple.com',
  GOOGL: 'google.com',
  META: 'meta.com',

  // Samsung
  '005930': 'samsung.com',
  '005930.KS': 'samsung.com',
  SSNLF: 'samsung.com',

  // China / CQQQ
  PDD: 'pinduoduo.com',
  '0700': 'tencent.com',
  '3690': 'meituan.com',
  '9888': 'baidu.com',
  '1024': 'kuaishou.com',
  '1347': 'huahonggrace.com',
  '1888': 'kingboard.com',
  '688256': 'cambricon.com',
  '688041': 'hygon.cn',
  '2382': 'sunnyoptical.com',
  '0020': 'sensetime.com',
  '9660': 'horizon.ai',
  '9626': 'bilibili.com',
  '002371': 'naura.com',
  TME: 'tencentmusic.com',
  '9698': 'gds-services.com',
  '3888': 'kingsoft.com',
  '0268': 'kingdee.com',
  JOYY: 'joyy.com',
  '000725': 'boe.com',
  ATHM: 'autohome.com.cn',

  // SCHD / value
  TXN: 'ti.com',
  QCOM: 'qualcomm.com',
  PG: 'pg.com',
  KO: 'coca-cola.com',
  CVX: 'chevron.com',
  COP: 'conocophillips.com',
  MRK: 'merck.com',
  UNH: 'unitedhealthgroup.com',
  AMGN: 'amgen.com',
  VZ: 'verizon.com',
  HD: 'homedepot.com',
  ABT: 'abbott.com',
  PEP: 'pepsico.com',
  BMY: 'bms.com',
  ACN: 'accenture.com',
  MO: 'altria.com',
  ADP: 'adp.com',
  LMT: 'lockheedmartin.com',
  BX: 'blackstone.com',
  EOG: 'eogresources.com',
  CMCSA: 'comcast.com',
  SLB: 'slb.com',
  UPS: 'ups.com',
  TGT: 'target.com',
  FAST: 'fastenal.com',
  'BRK.B': 'berkshirehathaway.com',
  SCHW: 'schwab.com',
  JPM: 'jpmorganchase.com',

  // NLR / nuclear
  CEG: 'constellationenergy.com',
  CCJ: 'cameco.com',
  PEG: 'pseg.com',
  FORTUM: 'fortum.com',
  BWXT: 'bwxt.com',
  '1816.HK': 'cgnpc.com.cn',
  NXE: 'nexgenenergy.ca',
  OKLO: 'oklo.com',
  KAP: 'kazatomprom.kz',
  XE: 'x-energy.com',
  UEC: 'uraniumenergy.com',
  LEU: 'centrusenergy.com',
  PDN: 'paladinenergy.com.au',
  DNN: 'denisonmines.com',
  UUUU: 'energyfuels.com',
  SMR: 'nuscalepower.com',
  YCA: 'yellowcakeplc.com',
  '052690.KS': 'kepco-enc.com',
  '1164.HK': 'cgnmc.com',
  NNE: 'nanonuclearenergy.com',

  // Crypto
  BCH: 'bitcoincash.org',
  HYPE: 'hyperliquid.xyz',
};

export default function AssetIcon({ asset, size = 16 }) {
  const iconSymbol = getIconSymbol(asset || {});
  const skipSi = SKIP_SI.has(iconSymbol);

  // stage: 0 = Simple Icons, 1 = DeBounce, 2 = Lucide
  const [stage, setStage] = useState(skipSi ? 1 : 0);

  const fallback = resolveIconLucide(asset || { symbol: iconSymbol });

  // 1. Bandera USA (ETFs core US)
  if (US_FLAG_SYMBOLS.has(iconSymbol) && stage === 0) {
    return (
      <img
        src="https://flagcdn.com/w40/us.png"
        alt="USA"
        width={size}
        height={Math.round(size * 0.75)}
        style={{
          borderRadius: 2,
          display: 'block',
          flexShrink: 0,
          objectFit: 'cover',
        }}
        onError={() => setStage(2)}
      />
    );
  }

  // 2. Simple Icons (salvo SKIP_SI)
  const slug = !skipSi ? SI_SLUGS[iconSymbol] : null;
  const color = SI_COLORS[iconSymbol];

  if (slug && stage === 0) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}/${(color || '#ffffff').replace('#', '')}`}
        alt={iconSymbol}
        width={size}
        height={size}
        style={{
          borderRadius: 3,
          display: 'block',
          flexShrink: 0,
          objectFit: 'contain',
        }}
        onError={() => setStage(1)}
      />
    );
  }

  // 3. DeBounce (logos reales)
  const domain = LOGO_DOMAINS[iconSymbol];
  if (domain && stage <= 1) {
    return (
      <img
        src={`https://logo.debounce.com/${domain}`}
        alt={iconSymbol}
        width={size}
        height={size}
        style={{
          borderRadius: 3,
          display: 'block',
          flexShrink: 0,
          objectFit: 'contain',
          background: 'transparent',
        }}
        onError={() => setStage(2)}
      />
    );
  }

  // 4. Lucide
  const Icon = fallback.Icon;
  return (
    <Icon
      size={size}
      color={fallback.color}
      strokeWidth={2}
      style={{ flexShrink: 0 }}
    />
  );
}