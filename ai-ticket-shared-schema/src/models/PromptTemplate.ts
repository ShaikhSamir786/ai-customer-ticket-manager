import {
  Table, Column, Model, DataType, Default,
} from 'sequelize-typescript';

@Table({ tableName: 'prompt_templates', timestamps: true })
export class PromptTemplate extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Default(1)
  @Column({ type: DataType.INTEGER })
  declare version: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare template: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), defaultValue: [] })
  declare variables: string[];

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare isActive: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  declare createdBy: string | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metrics: Record<string, unknown> | null;
}
