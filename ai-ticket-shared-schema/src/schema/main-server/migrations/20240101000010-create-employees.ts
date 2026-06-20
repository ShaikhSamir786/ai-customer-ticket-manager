import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('employees', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'AGENT' },
    department: {
      type: DataTypes.ENUM(
        'technical_support', 'finance_support', 'account_management',
        'product_support', 'legal', 'sales', 'customer_success'
      ),
      allowNull: true,
    },
    skills: { type: DataTypes.JSONB, defaultValue: {} },
    currentLoad: { type: DataTypes.INTEGER, defaultValue: 0 },
    maxLoad: { type: DataTypes.INTEGER, defaultValue: 5 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    teamId: { type: DataTypes.UUID, allowNull: true, references: { model: 'teams', key: 'id' } },
    userId: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('employees');
}
