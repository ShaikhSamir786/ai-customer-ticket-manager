import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { Ticket } from './Ticket';
import { User } from './User';

@Table({ tableName: 'override_history', timestamps: true, updatedAt: false })
export class OverrideHistory extends Model {
  @ForeignKey(() => Ticket)
  @Column({ type: DataType.STRING, allowNull: false })
  declare ticketId: string;

  @BelongsTo(() => Ticket)
  declare ticket: Ticket;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: false })
  declare agentId: string;

  @BelongsTo(() => User)
  declare agent: User;

  @Column({ type: DataType.STRING, allowNull: false })
  declare field: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare originalValue: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare newValue: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare reason: string;
}
