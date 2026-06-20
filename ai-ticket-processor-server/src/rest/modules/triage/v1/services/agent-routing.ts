import { Employee } from '@ai-ticket/shared-schema';

interface SkillEntry {
  name: string;
  proficiency: number;
  category: string;
}

interface AgentSkills {
  skills: SkillEntry[];
  languages: string[];
  certifications: string[];
  yearsOfExperience: number;
}

function calculateSkillMatch(agentSkills: AgentSkills, requiredSkills: string[]): number {
  if (!requiredSkills.length || !agentSkills?.skills?.length) return 0;

  const agentSkillNames = new Map(
    agentSkills.skills.map((s) => [s.name.toLowerCase(), s.proficiency])
  );

  let totalScore = 0;
  for (const required of requiredSkills) {
    totalScore += agentSkillNames.get(required.toLowerCase()) ?? 0;
  }

  return requiredSkills.length > 0 ? totalScore / requiredSkills.length : 0;
}

export async function findBestAgent(department: string, requiredSkills: string[]): Promise<Employee | null> {
  const agents = await Employee.findAll({
    where: {
      isActive: true,
      role: 'AGENT',
      department,
    },
  });

  if (!agents.length) return null;

  const scoredAgents = agents.map((agent) => ({
    agent,
    matchScore: calculateSkillMatch(agent.skills as unknown as AgentSkills, requiredSkills),
    loadScore: agent.maxLoad > 0 ? 1 - (agent.currentLoad / agent.maxLoad) : 0,
  }));

  scoredAgents.sort((a, b) => {
    const aScore = a.matchScore * 0.6 + a.loadScore * 0.4;
    const bScore = b.matchScore * 0.6 + b.loadScore * 0.4;
    return bScore - aScore;
  });

  return scoredAgents[0]?.agent ?? null;
}
