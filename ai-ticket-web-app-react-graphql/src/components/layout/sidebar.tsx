import React from 'react';
import { Inbox, ShieldAlert, CheckSquare, LogOut, Ticket, Activity } from 'lucide-react';
import { useAuthStore } from '../../features/auth/auth-store';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: {
    all: number;
    pendingReview: number;
    escalated: number;
    resolved: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, stats }) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { id: 'all', label: 'All Tickets', icon: Inbox, count: stats.all },
    { id: 'review', label: 'Pending Review', icon: Activity, count: stats.pendingReview, color: 'var(--accent-amber)' },
    { id: 'escalated', label: 'Escalated', icon: ShieldAlert, count: stats.escalated, color: 'var(--accent-rose)' },
    { id: 'resolved', label: 'Resolved', icon: CheckSquare, count: stats.resolved, color: 'var(--accent-emerald)' },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-section">
          <div className="brand-icon">
            <Ticket size={20} color="#070913" />
          </div>
          <span className="brand-name">GRAVITY</span>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: item.color ? `rgba(255,255,255,0.05)` : 'rgba(255, 255, 255, 0.1)',
                      color: item.color || 'var(--text-secondary)',
                      border: item.color ? `1px solid ${item.color}33` : 'none',
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#070913',
            textTransform: 'uppercase',
          }}
        >
          {user?.name ? user.name.slice(0, 2) : 'AG'}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'Support Agent'}</div>
          <div className="user-role">{user?.role || 'Agent'}</div>
        </div>
        <button className="btn-icon-only" onClick={logout} title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
