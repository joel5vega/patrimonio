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

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 40px',
    border: '1px solid var(--color-iron-peak)',
    borderRadius: 4,
    background: 'var(--color-graphite-card)',
    color: 'var(--color-bone)',
    fontFamily: 'var(--font-inter)',
    fontSize: 14,
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 8,
    fontFamily: 'var(--font-inter)',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--color-fog)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-carbon-canvas)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'var(--font-inter)',
        color: 'var(--color-bone)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              border: '1px solid var(--color-iron-peak)',
              borderRadius: 8,
              marginBottom: 16,
              background: 'var(--color-graphite-card)',
            }}
          >
            <TrendingUp size={28} color="var(--color-bone)" />
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-libre-baskerville)',
              fontSize: 32,
              fontWeight: 400,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              color: 'var(--color-bone)',
            }}
          >
            PatrimonioApp
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 14,
              color: 'var(--color-fog)',
            }}
          >
            Gestión de patrimonio personal
          </p>
        </div>

        <div
          style={{
            background: 'var(--color-graphite-card)',
            border: '1px solid var(--color-slate-elevated)',
            borderRadius: 8,
            padding: 24,
          }}
        >
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--color-smoke)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--color-smoke)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-smoke)',
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  border: '1px solid var(--color-iron-peak)',
                  background: 'var(--color-slate-elevated)',
                  borderRadius: 4,
                }}
              >
                <AlertCircle size={16} style={{ color: 'var(--color-fog)', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-fog)', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                color: 'var(--color-bone)',
                border: '1px solid var(--color-bone)',
                borderRadius: 4,
                fontFamily: 'var(--font-inter)',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-slate-elevated)' }} />
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-smoke)' }}>
              o
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-slate-elevated)' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              color: 'var(--color-bone)',
              border: '1px solid var(--color-iron-peak)',
              borderRadius: 4,
              fontFamily: 'var(--font-inter)',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
