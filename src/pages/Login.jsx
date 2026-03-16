import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const { loginEmail, loginGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleError = (e) => {
    const msgs = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-email': 'Email inválido',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
      'auth/invalid-credential': 'Credenciales incorrectas',
    };
    setError(msgs[e.code] || 'Error al iniciar sesión');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginEmail(email, password);
      navigate('/');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginGoogle();
      navigate('/');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-teal/10 rounded-3xl mb-4">
            <TrendingUp size={32} className="text-brand-teal" />
          </div>
          <h1 className="text-2xl font-black text-white">PatrimonioApp</h1>
          <p className="text-white/40 text-sm mt-1">Gestión de patrimonio personal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full bg-brand-card border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:border-brand-teal outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-white/30" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-brand-card border border-white/10 rounded-2xl py-3 pl-10 pr-10 text-sm focus:border-brand-teal outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-3 text-white/30 hover:text-white/60"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <p className="text-rose-400 text-xs font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-teal text-black py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs font-bold uppercase">o</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        

      </div>
    </div>
  );
};

export default Login;
