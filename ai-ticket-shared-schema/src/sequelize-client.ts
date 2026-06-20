import 'reflect-metadata';
import sequelizeInstance from './config';
import { Team, User, Ticket, TicketMessage, OverrideHistory, AuditLog, SLAPolicy, PromptTemplate, WebhookSubscription } from './schema/main-server/models';

const models = {
  Team, User, Ticket, TicketMessage,
  OverrideHistory, AuditLog, SLAPolicy,
  PromptTemplate, WebhookSubscription,
};

sequelizeInstance.addModels(Object.values(models));

export default sequelizeInstance;
export { sequelizeInstance as sequelize };
export { Team, User, Ticket, TicketMessage, OverrideHistory, AuditLog, SLAPolicy, PromptTemplate, WebhookSubscription };
