import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('sla_policies', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('billing', 'technical', 'account', 'product', 'legal', 'other'),
      allowNull: true,
    },
    customerTier: { type: DataTypes.STRING, allowNull: true },
    responseTargetMin: { type: DataTypes.INTEGER, allowNull: false },
    resolutionTargetMin: { type: DataTypes.INTEGER, allowNull: false },
    escalationMin: { type: DataTypes.INTEGER, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('sla_policies');
}
