import { Team, User, Ticket } from '@ai-ticket/shared-schema';
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
      { model: Ticket, as: 'tickets', attributes: [] },
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
      { model: Ticket, as: 'tickets', limit: 5, order: [['createdAt', 'DESC']] },
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

interface TeamUpdateData {
  name?: string;
  description?: string;
  skills?: string[];
  maxCapacity?: number;
  isActive?: boolean;
  [key: string]: unknown;
}

export async function updateTeam(id: string, data: TeamUpdateData) {
  const team = await Team.findByPk(id);
  if (!team) throw new NotFoundError('Team', id);

  const updateData: Partial<TeamUpdateData> = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.skills) updateData.skills = data.skills;
  if (data.maxCapacity) updateData.maxCapacity = data.maxCapacity;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await Team.update(updateData, { where: { id } });
  return Team.findByPk(id);
}
