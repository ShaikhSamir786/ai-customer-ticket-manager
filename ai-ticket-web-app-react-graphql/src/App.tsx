import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Sidebar } from './components/layout/sidebar';
import { TicketList } from './features/tickets/ticket-list';
import { TicketDetail } from './features/tickets/ticket-detail';
import { LoginForm } from './features/auth/login-form';
import { RegisterForm } from './features/auth/register-form';
import { useAuthStore } from './features/auth/auth-store';
import { GET_TICKETS } from './features/tickets/operations';
import { ShieldCheck, Loader2 } from 'lucide-react';
import './styles/global.css';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Map active Tab to Status API parameters
  const getQueryStatus = () => {
    if (activeTab === 'review') return 'pending';
    if (activeTab === 'escalated') return 'escalated';
    if (activeTab === 'resolved') return 'resolved';
    return statusFilter || undefined;
  };

  const { data, loading, error, refetch } = useQuery(GET_TICKETS, {
    variables: {
      status: getQueryStatus(),
      priority: priorityFilter || undefined,
      page,
      limit,
    },
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  // Automatically fetch when tab changes
  useEffect(() => {
    if (isAuthenticated) {
      refetch();
      setSelectedTicketId(null);
      setPage(1);
    }
  }, [activeTab, statusFilter, priorityFilter, isAuthenticated]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  if (!isAuthenticated) {
    return (
      <main className="auth-page">
        {showRegister ? (
          <RegisterForm onToggleAuth={() => setShowRegister(false)} />
        ) : (
          <LoginForm onToggleAuth={() => setShowRegister(true)} />
        )}
      </main>
    );
  }

  const ticketNodes = data?.tickets?.nodes || [];
  const totalCount = data?.tickets?.totalCount || 0;
  const hasNextPage = data?.tickets?.hasNextPage || false;
  const hasPreviousPage = data?.tickets?.hasPreviousPage || false;

  // Filter list locally for search term
  const filteredTickets = ticketNodes.filter((ticket: any) =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={{
          all: activeTab === 'all' ? totalCount : 4,
          pendingReview: activeTab === 'review' ? totalCount : 1,
          escalated: activeTab === 'escalated' ? totalCount : 1,
          resolved: activeTab === 'resolved' ? totalCount : 2,
        }}
      />

      {/* Main Dashboard Shell */}
      <main className="main-content">
        <header className="dashboard-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem' }}>
              Triage Workspace
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Logged in as <strong style={{ color: 'var(--accent-cyan)' }}>{user?.name}</strong> ({user?.role})
            </span>
          </div>

          <div className="quick-stats">
            <div className="stat-chip">
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              <span>AI Classifier Active</span>
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {loading && !data ? (
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Loader2 size={40} className="animate-spin" style={{ animation: 'spin 1.2s linear infinite', color: 'var(--accent-cyan)', marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Synchronizing support queues...</p>
            </div>
          ) : error ? (
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--accent-rose)' }}>
              <p>Connection Error: {error.message}</p>
            </div>
          ) : (
            <>
              {/* Ticket Cards List (Left Pane) */}
              <TicketList
                tickets={filteredTickets}
                selectedTicketId={selectedTicketId}
                onSelectTicket={(id) => setSelectedTicketId(id)}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                page={page}
                setPage={setPage}
                totalCount={totalCount}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
              />

              {/* Ticket Details & Triage Panel (Right Pane) */}
              <TicketDetail
                ticketId={selectedTicketId}
                onSuccess={(msg) => {
                  showToast(msg, 'success');
                  refetch();
                }}
              />
            </>
          )}
        </div>
      </main>

      {/* Dynamic Toast Alerts */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: toast.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}
          />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
