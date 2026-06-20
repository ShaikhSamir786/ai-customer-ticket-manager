import { Team, User } from '@ai-ticket/shared-schema';
import { NotFoundError } from '@ai-ticket/shared-lib';

export async function getTeams() {
  const teams = await Team.findAll({
    attributes: {
      include: [
        [Team.sequelize!.fn('COUNT', Team.sequelize!.col('members.id')), 'memberCount'],
        [Team.sequelize!.fn('COUNT', Team.sequelize!.col('tickets.id')), 'ticketCount'],
      ],
    },
    include: [
      { model: User, as: 'members', attributes: [] },
      { model: Team.sequelize!.model('Ticket') as any, as: 'tickets', attributes: [] },
    ],
    group: ['Team.id'],
    subQuery: false,
  });
  return teams;
}

export async function getTeam(id: string) {
  const team = await Team.findByPk(id, {
    include: [
      { model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'] },
      { model: Team.sequelize!.model('Ticket') as any, as: 'tickets', limit: 5, order: [['createdAt', 'DESC']] },
    ],
  });
  if (!team) throw new NotFoundError('Team', id);
  return team;
}

export async function createTeam(data: { name: string; description?: string; skills?: string[]; maxCapacity?: number }) {
  return Team.create({
    name: data.name,
    description: data.description,
    skills: data.skills || [],
    maxCapacity: data.maxCapacity || 20,
  });
}

export async function updateTeam(id: string, data: Record<string, any>) {
  const team = await Team.findByPk(id);
  if (!team) throw new NotFoundError('Team', id);

  const updateData: Record<string, any> = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.skills) updateData.skills = data.skills;
  if (data.maxCapacity) updateData.maxCapacity = data.maxCapacity;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await Team.update(updateData, { where: { id } });
  return Team.findByPk(id);
}
