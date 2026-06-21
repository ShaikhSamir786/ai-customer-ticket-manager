import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Mail, Lock, LogIn, AlertCircle, Loader } from 'lucide-react';
import { LOGIN_MUTATION } from '../tickets/operations';
import { useAuthStore } from './auth-store';

interface LoginFormProps {
  onToggleAuth: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loginStore = useAuthStore((state) => state.login);

  const [loginUser, { loading }] = useMutation(LOGIN_MUTATION, {
    onError: (err: any) => {
      setErrorMessage(err.message || 'Invalid email or password.');
    },
    onCompleted: (data: any) => {
      if (data && data.login) {
        loginStore(data.login.user, data.login.token);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    loginUser({
      variables: {
        input: { email, password },
      },
    });
  };

  return (
    <div className="auth-card glass-panel animate-fade-in">
      <div className="auth-logo">
        <h1>Gravity</h1>
        <p>AI-Powered Customer Support Portal</p>
      </div>

      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="triage-low-confidence-banner" style={{ marginBottom: '20px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <div style={{ position: 'relative' }}>
            <input
              id="email"
              type="email"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="agent@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
            <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type="password"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
            <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '10px', height: '46px' }}
          disabled={loading}
        >
          {loading ? (
            <Loader size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <LogIn size={18} />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="auth-toggle-link">
        Don't have an agent account? <span onClick={onToggleAuth}>Register here</span>
      </div>
    </div>
  );
};
