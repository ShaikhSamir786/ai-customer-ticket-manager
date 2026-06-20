import {
  Table, Column, Model, DataType, Default,
} from 'sequelize-typescript';

@Table({ tableName: 'webhook_subscriptions', timestamps: true })
export class WebhookSubscription extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  declare url: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  declare events: string[];

  @Column({ type: DataType.STRING, allowNull: false })
  declare secret: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  declare isActive: boolean;
}
