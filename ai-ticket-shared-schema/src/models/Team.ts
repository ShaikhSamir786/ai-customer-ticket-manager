import {
  Table, Column, Model, DataType, HasMany, Default,
} from 'sequelize-typescript';
import { User } from './User';
import { Ticket } from './Ticket';

@Table({ tableName: 'teams', timestamps: true })
export class Team extends Model {
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.ARRAY(DataType.STRING), defaultValue: [] })
  declare skills: string[];

  @Default(20)
  @Column({ type: DataType.INTEGER })
  declare maxCapacity: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  declare isActive: boolean;

  @HasMany(() => User)
  declare members: User[];

  @HasMany(() => Ticket)
  declare tickets: Ticket[];
}
