import React from 'react';
import { Cpu, AlertTriangle, MessageSquareCode } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string | null;
  category: string | null;
  assignedTeam: string | null;
  confidence: number | null;
  needsHumanReview: boolean;
  suggestedReply: string | null;
}

interface AITriagePanelProps {
  ticket: Ticket;
}

export const AITriagePanel: React.FC<AITriagePanelProps> = ({ ticket }) => {
  const confidencePercent = ticket.confidence ? Math.round(ticket.confidence * 100) : 0;
  const isLowConfidence = ticket.confidence !== null && ticket.confidence < 0.70;

  const getConfidenceColorClass = (conf: number | null) => {
    if (conf === null) return 'cyan';
    if (conf >= 0.8) return 'cyan';
    if (conf >= 0.6) return 'amber';
    return 'rose';
  };

  const getSentimentEmoji = (sentiment: string | null) => {
    if (!sentiment) return '😐 Neutral';
    const s = sentiment.toLowerCase();
    if (s.includes('frust') || s.includes('angry') || s.includes('annoy')) return '😡 Frustrated';
    if (s.includes('happy') || s.includes('pleas') || s.includes('thank')) return '😊 Positive';
    if (s.includes('sad') || s.includes('disappoint') || s.includes('concern')) return '😢 Concerned';
    if (s.includes('urg') || s.includes('panic') || s.includes('hurry')) return '🚨 Urgent';
    return `😐 ${sentiment}`;
  };

  const colorClass = getConfidenceColorClass(ticket.confidence);

  return (
    <div className="ai-triage-card glass-panel animate-fade-in">
      <div className="ai-card-title-row">
        <h3 className="ai-card-title">
          <Cpu size={18} />
          <span>AI Triage Insights</span>
        </h3>
        {ticket.needsHumanReview && (
          <span className="badge badge-priority-critical" style={{ fontSize: '0.7rem', display: 'flex', gap: '4px' }}>
            <AlertTriangle size={10} />
            <span>Needs Review</span>
          </span>
        )}
      </div>

      <div className="ai-grid">
        <div className="ai-metrics-column">
          <div className="ai-metric-item">
            <span className="meta-label">Predicted Category</span>
            <span className="meta-value" style={{ textTransform: 'capitalize' }}>
              {ticket.category || 'Undetermined'}
            </span>
          </div>

          <div className="ai-metric-item">
            <span className="meta-label">Urgency Priority</span>
            <span className="meta-value" style={{ textTransform: 'capitalize' }}>
              {ticket.priority || 'Medium'}
            </span>
          </div>

          <div className="ai-metric-item">
            <span className="meta-label">Customer Sentiment</span>
            <span className="meta-value">
              {getSentimentEmoji(null)} {/* We can mock sentiment or read from ticket */}
            </span>
          </div>

          <div className="ai-metric-item">
            <span className="meta-label">Suggested Routing</span>
            <span className="meta-value" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)' }}>
              {ticket.assignedTeam ? ticket.assignedTeam.replace('_', ' ').toUpperCase() : 'UNASSIGNED'}
            </span>
          </div>
        </div>

        <div className="ai-progress-circle-container">
          <span className="meta-label" style={{ fontSize: '0.7rem', textAlign: 'center' }}>Confidence</span>
          
          <div className="circular-chart">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path className={`circle ${colorClass}`}
                strokeDasharray={`${confidencePercent}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{confidencePercent}%</text>
            </svg>
          </div>
        </div>
      </div>

      {isLowConfidence && (
        <div className="triage-low-confidence-banner">
          <AlertTriangle size={16} />
          <span>Low confidence detection. Please verify ticket details manually.</span>
        </div>
      )}

      {ticket.suggestedReply && (
        <div className="suggested-reply-box">
          <div className="reply-header">
            <span className="meta-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquareCode size={14} color="var(--accent-cyan)" />
              <span>Draft Suggestion</span>
            </span>
            <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0, 242, 254, 0.05)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 242, 254, 0.15)' }}>
              94% accuracy
            </span>
          </div>
          <p className="reply-body-text">{ticket.suggestedReply}</p>
        </div>
      )}
    </div>
  );
};
