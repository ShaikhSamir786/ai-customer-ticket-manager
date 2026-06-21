import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { User, Mail, Lock, UserPlus, AlertCircle, Loader, Briefcase, CheckCircle } from 'lucide-react';
import { REGISTER_MUTATION } from '../tickets/operations';

interface RegisterFormProps {
  onToggleAuth: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleAuth }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent');
  const [teamId, setTeamId] = useState('technical_support');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [registerUser, { loading }] = useMutation(REGISTER_MUTATION, {
    onError: (err: any) => {
      setErrorMessage(err.message || 'Registration failed.');
    },
    onCompleted: () => {
      setIsSuccess(true);
      setTimeout(() => {
        onToggleAuth();
      }, 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    registerUser({
      variables: {
        input: { name, email, password, role, teamId },
      },
    });
  };

  if (isSuccess) {
    return (
      <div className="auth-card glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '50px 40px' }}>
        <CheckCircle size={56} style={{ color: 'var(--accent-emerald)', marginBottom: '20px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '10px' }}>Registration Successful!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Redirecting you to login screen...</p>
      </div>
    );
  }

  return (
    <div className="auth-card glass-panel animate-fade-in">
      <div className="auth-logo">
        <h1>Register</h1>
        <p>Create gravity support agent account</p>
      </div>

      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="triage-low-confidence-banner" style={{ marginBottom: '20px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="name">Full Name</label>
          <div style={{ position: 'relative' }}>
            <input
              id="name"
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Samir Shaikh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
            <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <div style={{ position: 'relative' }}>
            <input
              id="email"
              type="email"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="samir@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
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
              placeholder="Create strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="role">Role</label>
            <div style={{ position: 'relative' }}>
              <select
                id="role"
                className="form-select"
                style={{ paddingLeft: '40px' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="team">Assigned Team</label>
            <select
              id="team"
              className="form-select"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={loading}
            >
              <option value="technical_support">Technical Support</option>
              <option value="finance_support">Finance Support</option>
              <option value="account_management">Account Management</option>
              <option value="product_support">Product Support</option>
              <option value="legal">Legal</option>
              <option value="sales">Sales</option>
              <option value="customer_success">Customer Success</option>
            </select>
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
              <UserPlus size={18} />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      <div className="auth-toggle-link">
        Already have an account? <span onClick={onToggleAuth}>Sign in instead</span>
      </div>
    </div>
  );
};
