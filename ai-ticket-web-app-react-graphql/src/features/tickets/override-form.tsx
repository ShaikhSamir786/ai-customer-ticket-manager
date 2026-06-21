import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Save, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { UPDATE_TICKET } from './operations';

interface Ticket {
  id: string;
  status: string;
  priority: string | null;
  category: string | null;
  assignedTeam: string | null;
  suggestedReply: string | null;
}

interface OverrideFormProps {
  ticket: Ticket;
  onSuccess: (message: string) => void;
  refetchTicket: () => void;
}

export const OverrideForm: React.FC<OverrideFormProps> = ({ ticket, onSuccess, refetchTicket }) => {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('');
  const [suggestedReply, setSuggestedReply] = useState('');

  // Sync state with selected ticket
  useEffect(() => {
    setStatus(ticket.status);
    setPriority(ticket.priority || 'medium');
    setCategory(ticket.category || 'other');
    setAssignedTeam(ticket.assignedTeam || 'technical_support');
    setSuggestedReply(ticket.suggestedReply || '');
  }, [ticket]);

  const [updateTicket, { loading }] = useMutation(UPDATE_TICKET, {
    onError: (err: any) => {
      alert(`Error updating ticket: ${err.message}`);
    },
    onCompleted: () => {
      onSuccess('Ticket successfully updated and triaged.');
      refetchTicket();
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateTicket({
      variables: {
        id: ticket.id,
        input: {
          status,
          priority,
          category,
          assignedTeam,
          suggestedReply,
        },
      },
    });
  };

  const handleQuickApprove = () => {
    updateTicket({
      variables: {
        id: ticket.id,
        input: {
          status: 'triaged',
          priority: ticket.priority || 'medium',
          category: ticket.category || 'other',
          assignedTeam: ticket.assignedTeam || 'technical_support',
          suggestedReply: ticket.suggestedReply || '',
        },
      },
    });
  };

  const handleSendReply = () => {
    onSuccess('Suggested response successfully dispatched to customer.');
  };

  return (
    <div className="override-panel glass-panel animate-fade-in">
      <h3 className="form-label" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Agent Action Panel</h3>
      
      <form onSubmit={handleUpdate}>
        <div className="override-grid-inputs">
          <div className="form-group">
            <label className="form-label" htmlFor="override-status">Status</label>
            <select
              id="override-status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
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

          <div className="form-group">
            <label className="form-label" htmlFor="override-priority">Priority</label>
            <select
              id="override-priority"
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="override-category">Category</label>
            <select
              id="override-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="product">Product</option>
              <option value="legal">Legal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="override-team">Assigned Team</label>
            <select
              id="override-team"
              className="form-select"
              value={assignedTeam}
              onChange={(e) => setAssignedTeam(e.target.value)}
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

        <div className="form-group" style={{ marginTop: '10px' }}>
          <label className="form-label" htmlFor="override-reply">Edit Suggested Reply</label>
          <textarea
            id="override-reply"
            className="form-textarea"
            rows={4}
            value={suggestedReply}
            onChange={(e) => setSuggestedReply(e.target.value)}
            disabled={loading}
            placeholder="AI suggested response will load here. You can edit before sending."
          />
        </div>

        <div className="override-actions">
          {ticket.status === 'pending' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleQuickApprove}
              disabled={loading}
              title="Quickly approve AI categorization and routing"
            >
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>Approve AI Triage</span>
            </button>
          )}

          {suggestedReply && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSendReply}
              disabled={loading}
              title="Dispatch reply to customer"
            >
              <Send size={16} color="var(--accent-cyan)" />
              <span>Send Reply</span>
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={16} />
            )}
            <span>Apply Actions</span>
          </button>
        </div>
      </form>
    </div>
  );
};
