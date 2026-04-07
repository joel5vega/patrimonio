import { HashRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import WealthHistory from './pages/WealthHistory';
import ManualAssets from './pages/ManualAssets';
import NewTransaction from './pages/NewTransaction';
import BankImport from './pages/BankImport';
import Login from './pages/Login';
import Budget from './pages/Budget';
import QuantDashboard from './pages/QuantDashboard'
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }}>Cargando...</div>;

  if (!user) return <Login />;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="history" element={<WealthHistory />} />
        <Route path="manual" element={<ManualAssets />} />
        <Route path="budget" element={<Budget />} />
        <Route path="quant" element={<QuantDashboard />} />
      </Route>
      <Route path="/new-transaction" element={<NewTransaction />} />
      <Route path="/bank-import" element={<BankImport />} />
    </Routes>
  );
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;
