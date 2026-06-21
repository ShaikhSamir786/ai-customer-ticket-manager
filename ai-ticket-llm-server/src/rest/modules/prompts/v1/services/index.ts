import { PromptTemplate, sequelize } from '@ai-ticket/shared-schema';
import { ValidationError } from '@ai-ticket/shared-lib';

export async function getPrompts() {
  return PromptTemplate.findAll({ order: [['createdAt', 'DESC']] });
}

export async function createPrompt(data: { name: string; template: string; variables?: string[]; isActive?: boolean }) {
  if (!data.name || !data.template) throw new ValidationError('name and template are required');

  const result = await sequelize.transaction(async (tx) => {
    const latestVersion = await PromptTemplate.findOne({
      where: { name: data.name },
      order: [['version', 'DESC']],
      attributes: ['version'],
      transaction: tx,
      lock: true,
    });

    return PromptTemplate.create({
      name: data.name,
      template: data.template,
      variables: data.variables || [],
      version: (latestVersion?.version || 0) + 1,
      isActive: data.isActive || false,
    }, { transaction: tx });
  });

  return result;
}
