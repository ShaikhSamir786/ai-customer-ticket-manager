import React, { useState } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string | null;
  category: string | null;
  assignedTeam: string | null;
  confidence: number | null;
  createdAt: string;
}

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  page,
  setPage,
  totalCount,
  hasNextPage,
  hasPreviousPage,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(Number(dateStr) ? Number(dateStr) : dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return dateStr;
    }
  };

  const getPriorityClass = (priority: string | null) => {
    if (!priority) return 'badge-priority-low';
    return `badge-priority-${priority.toLowerCase()}`;
  };

  const getStatusClass = (status: string) => {
    return `badge-status-${status.toLowerCase()}`;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  return (
    <div className="ticket-list-panel">
      <div className="ticket-filters">
        <div className="search-container">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search tickets by subject..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Search size={16} className="search-icon" />
        </div>

        <button 
          type="button"
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={14} />
          <span>{showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}</span>
        </button>

        {showFilters && (
          <div className="filter-row animate-fade-in">
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }} htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                className="form-select filter-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="triaging">Triaging</option>
                <option value="triaged">Triaged</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }} htmlFor="priority-filter">Priority</label>
              <select
                id="priority-filter"
                className="form-select filter-select"
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="tickets-container">
        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Inbox size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>No tickets found matching filters</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`ticket-card-item glass-panel ${selectedTicketId === ticket.id ? 'selected' : ''}`}
              onClick={() => onSelectTicket(ticket.id)}
            >
              <div className="ticket-card-header">
                <span className="ticket-card-subject">{ticket.subject}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                  #{ticket.id.slice(0, 4)}
                </span>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ticket.message}
              </div>

              <div className="ticket-card-meta">
                <div className="ticket-card-badges">
                  {ticket.priority && (
                    <span className={`badge ${getPriorityClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  )}
                  <span className={`badge ${getStatusClass(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <span>{formatTime(ticket.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination-footer">
        <span>Total: {totalCount}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-secondary pagination-btn"
            disabled={!hasPreviousPage}
            onClick={() => setPage(page - 1)}
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>
          <span>Page {page}</span>
          <button
            className="btn btn-secondary pagination-btn"
            disabled={!hasNextPage}
            onClick={() => setPage(page + 1)}
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
