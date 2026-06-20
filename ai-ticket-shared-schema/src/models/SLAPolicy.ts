import {
  Table, Column, Model, DataType, Default,
} from 'sequelize-typescript';
import { TicketPriority, TicketCategory } from '../enums';

@Table({ tableName: 'sla_policies', timestamps: true })
export class SLAPolicy extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.ENUM(...Object.values(TicketPriority)), allowNull: false })
  declare priority: TicketPriority;

  @Column({ type: DataType.ENUM(...Object.values(TicketCategory)), allowNull: true })
  declare category: TicketCategory | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare customerTier: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare responseTargetMin: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare resolutionTargetMin: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare escalationMin: number | null;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  declare isActive: boolean;
}
