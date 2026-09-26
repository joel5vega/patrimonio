import { CRYPTO_ICONS } from './portfolioConstants';

const TypeIcon = ({ type, symbol }) => {
  const icons = {
    crypto: CRYPTO_ICONS[symbol] || CRYPTO_ICONS.DEFAULT,
    etf: 'show_chart', manual: 'savings', stock: 'monitoring',
    stable: 'attach_money', patrimony: 'home_work',
  };
  return (
    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#22d3ee' }}>
      {icons[type] || 'account_balance'}
    </span>
  );
};

export default TypeIcon;