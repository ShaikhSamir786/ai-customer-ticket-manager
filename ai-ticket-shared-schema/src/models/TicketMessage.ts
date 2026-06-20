import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, Default,
} from 'sequelize-typescript';
import { Ticket } from './Ticket';
import { User } from './User';

@Table({ tableName: 'ticket_messages', timestamps: true, updatedAt: false })
export class TicketMessage extends Model {
  @ForeignKey(() => Ticket)
  @Column({ type: DataType.STRING, allowNull: false })
  declare ticketId: string;

  @BelongsTo(() => Ticket)
  declare ticket: Ticket;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: true })
  declare authorId: string | null;

  @BelongsTo(() => User)
  declare author: User | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare isInternal: boolean;
}
