import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('override_history', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    ticketId: { type: DataTypes.UUID, allowNull: false, references: { model: 'tickets', key: 'id' } },
    agentId: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    field: { type: DataTypes.STRING, allowNull: false },
    originalValue: { type: DataTypes.TEXT, allowNull: false },
    newValue: { type: DataTypes.TEXT, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('override_history');
}
