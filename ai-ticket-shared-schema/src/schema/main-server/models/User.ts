import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, Default,
} from 'sequelize-typescript';
import { Team } from './Team';
import { Ticket } from './Ticket';
import { TicketMessage } from './TicketMessage';
import { OverrideHistory } from './OverrideHistory';
import { AuditLog } from './AuditLog';
import { UserRole } from '../../../enums';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Default(UserRole.AGENT)
  @Column({ type: DataType.ENUM(...Object.values(UserRole)) })
  declare role: UserRole;

  @Column({ type: DataType.STRING, allowNull: false })
  declare passwordHash: string;

  @ForeignKey(() => Team)
  @Column({ type: DataType.STRING, allowNull: true })
  declare teamId: string | null;

  @BelongsTo(() => Team)
  declare team: Team | null;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  declare isActive: boolean;

  @HasMany(() => Ticket, 'assignedAgentId')
  declare assignedTickets: Ticket[];

  @HasMany(() => Ticket, 'createdByAgentId')
  declare createdTickets: Ticket[];

  @HasMany(() => TicketMessage)
  declare messages: TicketMessage[];

  @HasMany(() => OverrideHistory)
  declare overrideHistory: OverrideHistory[];

  @HasMany(() => AuditLog)
  declare auditLogs: AuditLog[];
}
