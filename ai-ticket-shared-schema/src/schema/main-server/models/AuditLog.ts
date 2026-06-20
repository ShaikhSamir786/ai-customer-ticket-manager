import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { Ticket } from './Ticket';
import { User } from './User';

@Table({ tableName: 'audit_logs', timestamps: true, updatedAt: false })
export class AuditLog extends Model {
  @ForeignKey(() => Ticket)
  @Column({ type: DataType.STRING, allowNull: true })
  declare ticketId: string | null;

  @BelongsTo(() => Ticket)
  declare ticket: Ticket | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: true })
  declare userId: string | null;

  @BelongsTo(() => User)
  declare user: User | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare action: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare entity: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare entityId: string | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metadata: Record<string, unknown> | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare ipAddress: string | null;
}
