import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import WealthHistory from './pages/WealthHistory';
import ManualAssets from './pages/ManualAssets';
import NewTransaction from './pages/NewTransaction';
import BankImport from './pages/BankImport';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="history" element={<WealthHistory />} />
          <Route path="manual" element={<ManualAssets />} />
        </Route>
        <Route path="/new-transaction" element={<NewTransaction />} />
        <Route path="/bank-import" element={<BankImport />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
