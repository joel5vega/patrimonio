import {
  Activity,
  BarChart3,
  Bitcoin,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Coins,
  Database,
  Gem,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  Zap,
} from 'lucide-react';

export const ICONS = {
  activity: Activity,
  chart: BarChart3,
  bitcoin: Bitcoin,
  briefcase: BriefcaseBusiness,
  building: Building2,
  dollar: CircleDollarSign,
  coins: Coins,
  database: Database,
  gem: Gem,
  landmark: Landmark,
  lock: LockKeyhole,
  shield: ShieldCheck,
  trend: TrendingUp,
  wallet: WalletCards,
  yield: Zap,
};

export function PortfolioIcon({ name, size = 16, ...props }) {
  const Icon = ICONS[name] || WalletCards;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}