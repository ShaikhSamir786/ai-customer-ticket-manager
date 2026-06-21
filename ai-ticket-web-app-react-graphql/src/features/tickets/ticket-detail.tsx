import React from 'react';
import { useQuery } from '@apollo/client';
import { Mail, Clock, Loader2, User } from 'lucide-react';
import { GET_TICKET_DETAIL } from './operations';
import { AITriagePanel } from './ai-triage-panel';
import { OverrideForm } from './override-form';

interface TicketDetailProps {
  ticketId: string | null;
  onSuccess: (message: string) => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onSuccess }) => {
  const { data, loading, error, refetch } = useQuery(GET_TICKET_DETAIL, {
    variables: { id: ticketId },
    skip: !ticketId,
  });

  if (!ticketId) {
    return (
      <div className="ticket-details-area">
        <div className="empty-state-detail">
          <Mail />
          <h3>No Ticket Selected</h3>
          <p>Choose an incoming ticket from the left panel to review AI annotations, routing, and drafts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ticket-details-area">
        <div className="empty-state-detail">
          <Loader2 size={36} className="animate-spin" style={{ animation: 'spin 1.2s linear infinite', color: 'var(--accent-cyan)' }} />
          <h3>Analyzing Details...</h3>
          <p>Retrieving ticket metadata and processing neural triage insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-details-area">
        <div className="empty-state-detail" style={{ color: 'var(--accent-rose)' }}>
          <h3>Error Fetching Details</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  const ticket = data?.ticket;

  if (!ticket) {
    return (
      <div className="ticket-details-area">
        <div className="empty-state-detail">
          <h3>Ticket Not Found</h3>
          <p>The requested ticket could not be retrieved from the database.</p>
        </div>
      </div>
    );
  }

  const formatFullTime = (dateStr: string) => {
    try {
      const date = new Date(Number(dateStr) ? Number(dateStr) : dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="ticket-details-area">
      <div className="details-content-scrollable">
        
        {/* Ticket Title Card */}
        <div className="ticket-detail-header-card glass-panel">
          <div className="detail-subject-row">
            <h2 className="detail-subject">{ticket.subject}</h2>
            <span className="ticket-id-tag">ID: #{ticket.id.slice(0, 8)}</span>
          </div>

          <div className="detail-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Customer ID</span>
              <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={12} color="var(--accent-cyan)" />
                <span>{ticket.customerId || 'Unknown'}</span>
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Source Channel</span>
              <span className="meta-value" style={{ textTransform: 'uppercase' }}>{ticket.source || 'WEB'}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Created Time</span>
              <span className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} color="var(--text-muted)" />
                <span style={{ fontSize: '0.8rem' }}>{formatFullTime(ticket.createdAt)}</span>
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Current Status</span>
              <span className="meta-value" style={{ textTransform: 'capitalize' }}>{ticket.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Message Content Card */}
        <div className="detail-message-card glass-panel">
          <h4 className="form-label" style={{ marginBottom: '12px' }}>Ticket Message Body</h4>
          <div className="message-body">{ticket.message}</div>
        </div>

        {/* AI Triage Card */}
        <AITriagePanel ticket={ticket} />

        {/* Manual Override Action Box */}
        <OverrideForm 
          ticket={ticket} 
          onSuccess={onSuccess} 
          refetchTicket={refetch} 
        />
        
      </div>
    </div>
  );
};
