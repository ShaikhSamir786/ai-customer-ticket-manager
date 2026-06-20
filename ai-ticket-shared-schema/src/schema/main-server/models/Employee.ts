import {
  Table, Column, Model, DataType, Default, PrimaryKey,
  ForeignKey, BelongsTo, HasMany,
} from 'sequelize-typescript';
import { Team } from './Team';
import { Ticket } from './Ticket';
import { User } from './User';
import { Department } from '../../../enums';

@Table({ tableName: 'employees', timestamps: true })
export class Employee extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  declare id: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.ENUM(...Object.values(Department)), allowNull: true })
  declare department: Department | null;

  @Default({ skills: [], languages: [], certifications: [], yearsOfExperience: 0 })
  @Column({ type: DataType.JSONB })
  declare skills: object;

  @Default(0)
  @Column({ type: DataType.INTEGER })
  declare currentLoad: number;

  @Default(5)
  @Column({ type: DataType.INTEGER })
  declare maxLoad: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  declare isActive: boolean;

  @Column({ type: DataType.STRING })
  declare role: string;

  @ForeignKey(() => Team)
  @Column({ type: DataType.UUID, allowNull: true })
  declare teamId: string | null;

  @BelongsTo(() => Team)
  declare team: Team | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare userId: string | null;

  @BelongsTo(() => User)
  declare user: User | null;

  @HasMany(() => Ticket, 'assignedAgentId')
  declare assignedTickets: Ticket[];
}
