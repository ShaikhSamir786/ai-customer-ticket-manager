import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('tickets', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    customerId: { type: DataTypes.STRING, allowNull: false },
    customerName: { type: DataTypes.STRING, allowNull: true },
    customerEmail: { type: DataTypes.STRING, allowNull: true },
    customerTier: { type: DataTypes.STRING, defaultValue: 'standard' },
    sourceChannel: { type: DataTypes.STRING, defaultValue: 'web' },
    subject: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'triaging', 'triaged', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'escalated', 'error_requires_manual'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    category: {
      type: DataTypes.ENUM('billing', 'technical', 'account', 'product', 'legal', 'other'),
      allowNull: true,
    },
    subcategory: { type: DataTypes.STRING, allowNull: true },
    assignedTeamId: { type: DataTypes.UUID, allowNull: true, references: { model: 'teams', key: 'id' } },
    assignedAgentId: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
    assignmentMethod: { type: DataTypes.STRING, defaultValue: 'ai_hybrid' },
    assignmentReason: { type: DataTypes.TEXT, allowNull: true },
    assignmentConfidence: { type: DataTypes.FLOAT, allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: true },
    sentiment: { type: DataTypes.STRING, allowNull: true },
    churnRisk: { type: DataTypes.FLOAT, allowNull: true },
    confidence: { type: DataTypes.FLOAT, allowNull: true },
    needsHumanReview: { type: DataTypes.BOOLEAN, defaultValue: false },
    suggestedReply: { type: DataTypes.TEXT, allowNull: true },
    modelUsed: { type: DataTypes.STRING, allowNull: true },
    overrideReason: { type: DataTypes.TEXT, allowNull: true },
    createdByAgentId: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('tickets');
}
