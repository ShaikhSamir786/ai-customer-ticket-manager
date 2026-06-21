import { QueryInterface } from 'sequelize';

/**
 * Adds performance indexes for the most common query patterns:
 *
 * - Ticket list/queue filtering by status (with created_at for ordering)
 * - Ticket list/queue filtering by priority + assigned team
 * - Audit history lookup by ticket (chronological)
 * - Conversation lookup by ticket
 *
 * Uses CREATE INDEX CONCURRENTLY where the table may already hold data, so the
 * migration does not take an exclusive lock. Note: CONCURRENTLY cannot run
 * inside a transaction, so Sequelize's automatic transaction-per-migration
 * must be disabled by the runner. For the simple `sequelize.query` runner used
 * here (no wrapping transaction), this is already the case. If the migration is
 * ever executed through a transactional runner, wrap each statement separately.
 *
 * Idempotent: `IF NOT EXISTS` makes re-runs safe.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  const statements = [
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_status_created
       ON tickets (status, created_at)`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_priority_assigned
       ON tickets (priority, assigned_team_id)`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_ticket
       ON audit_logs (ticket_id, created_at)`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_messages_ticket
       ON ticket_messages (ticket_id)`,
  ];

  for (const sql of statements) {
    await queryInterface.sequelize.query(sql);
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const statements = [
    `DROP INDEX CONCURRENTLY IF EXISTS idx_ticket_messages_ticket`,
    `DROP INDEX CONCURRENTLY IF EXISTS idx_audit_logs_ticket`,
    `DROP INDEX CONCURRENTLY IF EXISTS idx_tickets_priority_assigned`,
    `DROP INDEX CONCURRENTLY IF EXISTS idx_tickets_status_created`,
  ];

  for (const sql of statements) {
    await queryInterface.sequelize.query(sql);
  }
}
