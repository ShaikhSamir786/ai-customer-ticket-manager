import { TicketStatus } from '../enums';

export async function seedDefaultSLAPolicies() {
  const { SLAPolicy } = await import('../schema/main-server/models/SLAPolicy');

  const defaults = [
    { name: 'Critical - 15min Response', priority: 'critical', responseTargetMin: 15, resolutionTargetMin: 60, escalationMin: 30 },
    { name: 'High - 1hr Response', priority: 'high', responseTargetMin: 60, resolutionTargetMin: 240, escalationMin: 120 },
    { name: 'Medium - 4hr Response', priority: 'medium', responseTargetMin: 240, resolutionTargetMin: 1440, escalationMin: 480 },
    { name: 'Low - 8hr Response', priority: 'low', responseTargetMin: 480, resolutionTargetMin: 2880 },
  ];

  for (const sla of defaults) {
    await SLAPolicy.findOrCreate({
      where: { name: sla.name },
      defaults: sla,
    });
  }
}

export async function seedDefaultPromptTemplates() {
  const { PromptTemplate } = await import('../schema/main-server/models/PromptTemplate');

  const defaults = [
    {
      name: 'triage-classification',
      template: `Classify the following support ticket into one of these categories: billing, technical, account, product, legal, other.\n\nSubject: {{subject}}\nMessage: {{message}}\n\nCategory:`,
      variables: ['subject', 'message'],
    },
    {
      name: 'triage-priority',
      template: `Assign urgency (low, medium, high, critical) for this ticket.\n\nSubject: {{subject}}\nMessage: {{message}}\nCustomer Tier: {{customerTier}}\n\nPriority:`,
      variables: ['subject', 'message', 'customerTier'],
    },
    {
      name: 'triage-reply',
      template: `Generate a helpful reply for this {{category}} support ticket.\n\nCustomer: {{customerName}}\nIssue: {{message}}\n\nReply:`,
      variables: ['category', 'customerName', 'message'],
    },
  ];

  for (const pt of defaults) {
    await PromptTemplate.findOrCreate({
      where: { name: pt.name },
      defaults: pt,
    });
  }
}

export async function runSeeders() {
  await seedDefaultSLAPolicies();
  await seedDefaultPromptTemplates();
}
