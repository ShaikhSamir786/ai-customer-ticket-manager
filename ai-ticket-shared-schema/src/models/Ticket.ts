import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, Default,
} from 'sequelize-typescript';
import { Team } from './Team';
import { User } from './User';
import { TicketMessage } from './TicketMessage';
import { OverrideHistory } from './OverrideHistory';
import { AuditLog } from './AuditLog';
import { TicketStatus, TicketPriority, TicketCategory } from '../enums';

@Table({ tableName: 'tickets', timestamps: true })
export class Ticket extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare customerId: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare customerName: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare customerEmail: string | null;

  @Default('standard')
  @Column({ type: DataType.STRING })
  declare customerTier: string;

  @Default('web')
  @Column({ type: DataType.STRING })
  declare sourceChannel: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare subject: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare message: string;

  @Default(TicketStatus.PENDING)
  @Column({ type: DataType.ENUM(...Object.values(TicketStatus)) })
  declare status: TicketStatus;

  @Default(TicketPriority.MEDIUM)
  @Column({ type: DataType.ENUM(...Object.values(TicketPriority)) })
  declare priority: TicketPriority;

  @Column({ type: DataType.ENUM(...Object.values(TicketCategory)), allowNull: true })
  declare category: TicketCategory | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare subcategory: string | null;

  @ForeignKey(() => Team)
  @Column({ type: DataType.STRING, allowNull: true })
  declare assignedTeamId: string | null;

  @BelongsTo(() => Team)
  declare assignedTeam: Team | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: true })
  declare assignedAgentId: string | null;

  @BelongsTo(() => User, 'assignedAgentId')
  declare assignedAgent: User | null;

  @Default('ai_hybrid')
  @Column({ type: DataType.STRING })
  declare assignmentMethod: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare assignmentReason: string | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  declare assignmentConfidence: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare assignedAt: Date | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare sentiment: string | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  declare churnRisk: number | null;

  @Column({ type: DataType.FLOAT, allowNull: true })
  declare confidence: number | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare needsHumanReview: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare suggestedReply: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare modelUsed: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare overrideReason: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: true })
  declare createdByAgentId: string | null;

  @BelongsTo(() => User, 'createdByAgentId')
  declare createdByAgent: User | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare resolvedAt: Date | null;

  @HasMany(() => TicketMessage)
  declare messages: TicketMessage[];

  @HasMany(() => OverrideHistory)
  declare overrideHistory: OverrideHistory[];

  @HasMany(() => AuditLog)
  declare auditLogs: AuditLog[];
}
