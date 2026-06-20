# Default Employees Configuration Guide

## What is This?

A **boot-time seeding system** that automatically populates the database with predefined employees (agents) when the core server starts. Each employee has:
- **Team** (e.g., Technical Support, Finance)
- **Skills** (JSON format with proficiency levels)
- **Workload capacity** (max concurrent tickets)
- **Availability status**

## Why This Feature

### Problem It Solves
Without default employees:
- Empty database → No agents to assign tickets to
- AI can't route tickets (no destination)
- Manual setup required every deployment
- Inconsistent team structures across environments

### Benefits
| Benefit | Description |
|---------|-------------|
| **Immediate AI routing** | Agents exist from first server start |
| **Consistent testing** | Same employee data in dev/staging/prod |
| **Demo ready** | New deployments work out-of-box |
| **Skill-based matching** | AI can match tickets to agent expertise |
| **Load balancing** | Track workload per agent from day 1 |

---

## Required Changes

### 1. Enum Changes

**File:** `ai-ticket-shared-schema/src/enums.ts`

Add `Department` enum to the existing file alongside `UserRole`, `TicketStatus`, etc.:

```typescript
export enum Department {
  TECHNICAL_SUPPORT = 'technical_support',
  FINANCE_SUPPORT = 'finance_support',
  ACCOUNT_MANAGEMENT = 'account_management',
  PRODUCT_SUPPORT = 'product_support',
  LEGAL = 'legal',
  SALES = 'sales',
  CUSTOMER_SUCCESS = 'customer_success',
}
```

### 2. Database Schema Changes

**File:** `ai-ticket-shared-schema/src/schema/main-server/models/User.ts`

Add new fields to the existing `User` model (using `sequelize-typescript` decorators):

```typescript
import { UserRole, Department } from '../../../enums';

// Add to existing User class:

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
```

**File:** `ai-ticket-shared-schema/src/schema/main-server/models/User.ts` — update imports:

```typescript
import { UserRole, Department } from '../../../enums';
```

**Add migration:**
Create `ai-ticket-shared-schema/src/schema/main-server/migrations/20240101000010-add-employee-fields.ts`:

```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('users', 'department', {
    type: DataTypes.ENUM(
      'technical_support', 'finance_support', 'account_management',
      'product_support', 'legal', 'sales', 'customer_success'
    ),
    allowNull: true,
  });
  await queryInterface.addColumn('users', 'skills', { type: DataTypes.JSONB, defaultValue: {} });
  await queryInterface.addColumn('users', 'currentLoad', { type: DataTypes.INTEGER, defaultValue: 0 });
  await queryInterface.addColumn('users', 'maxLoad', { type: DataTypes.INTEGER, defaultValue: 5 });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn('users', 'department');
  await queryInterface.removeColumn('users', 'skills');
  await queryInterface.removeColumn('users', 'currentLoad');
  await queryInterface.removeColumn('users', 'maxLoad');
}
```

Run migration:
```bash
npx ts-node ../../node_modules/.bin/sequelize db:migrate
```

### 3. Create Boot File

**File:** `ai-ticket-core-server/src/boot/seed-default-employees.ts`

```typescript
import { User } from '@ai-ticket/shared-schema';
import { logger } from '../logger';

const defaultEmployees = [
  // Technical Support Team
  {
    email: 'alex.tech@ticketai.com',
    name: 'Alex Chen',
    role: 'AGENT' as const,
    department: 'TECHNICAL_SUPPORT',
    skills: {
      skills: [
        { name: 'api_debugging', proficiency: 95, category: 'technical' },
        { name: 'error_handling', proficiency: 90, category: 'technical' },
        { name: 'performance_issues', proficiency: 85, category: 'technical' },
      ],
      languages: ['en', 'zh'],
      certifications: ['AWS Certified'],
      yearsOfExperience: 5,
    },
    maxLoad: 5,
    isActive: true,
  },
  {
    email: 'sarah.tech@ticketai.com',
    name: 'Sarah Johnson',
    role: 'AGENT' as const,
    department: 'TECHNICAL_SUPPORT',
    skills: {
      skills: [
        { name: 'mobile_apps', proficiency: 92, category: 'technical' },
        { name: 'database_issues', proficiency: 88, category: 'technical' },
        { name: 'security', proficiency: 85, category: 'technical' },
      ],
      languages: ['en'],
      certifications: ['Security+'],
      yearsOfExperience: 4,
    },
    maxLoad: 5,
    isActive: true,
  },

  // Finance Support Team
  {
    email: 'maria.finance@ticketai.com',
    name: 'Maria Garcia',
    role: 'AGENT' as const,
    department: 'FINANCE_SUPPORT',
    skills: {
      skills: [
        { name: 'refund_processing', proficiency: 98, category: 'billing' },
        { name: 'payment_disputes', proficiency: 95, category: 'billing' },
        { name: 'invoice_management', proficiency: 92, category: 'billing' },
        { name: 'subscription_billing', proficiency: 90, category: 'billing' },
      ],
      languages: ['en', 'es'],
      certifications: ['Accounting Basics'],
      yearsOfExperience: 6,
    },
    maxLoad: 5,
    isActive: true,
  },
  {
    email: 'john.finance@ticketai.com',
    name: 'John Smith',
    role: 'AGENT' as const,
    department: 'FINANCE_SUPPORT',
    skills: {
      skills: [
        { name: 'chargeback_handling', proficiency: 92, category: 'billing' },
        { name: 'payment_gateways', proficiency: 88, category: 'billing' },
        { name: 'tax_compliance', proficiency: 85, category: 'billing' },
      ],
      languages: ['en'],
      certifications: ['QuickBooks'],
      yearsOfExperience: 4,
    },
    maxLoad: 5,
    isActive: true,
  },

  // Account Management Team
  {
    email: 'david.account@ticketai.com',
    name: 'David Kim',
    role: 'AGENT' as const,
    department: 'ACCOUNT_MANAGEMENT',
    skills: {
      skills: [
        { name: 'account_upgrade', proficiency: 95, category: 'account' },
        { name: 'cancellation_retention', proficiency: 90, category: 'account' },
        { name: 'profile_updates', proficiency: 88, category: 'account' },
      ],
      languages: ['en', 'ko'],
      certifications: ['Customer Success'],
      yearsOfExperience: 4,
    },
    maxLoad: 5,
    isActive: true,
  },
  {
    email: 'lisa.account@ticketai.com',
    name: 'Lisa Wong',
    role: 'AGENT' as const,
    department: 'ACCOUNT_MANAGEMENT',
    skills: {
      skills: [
        { name: 'onboarding', proficiency: 92, category: 'account' },
        { name: 'billing_inquiries', proficiency: 88, category: 'account' },
        { name: 'data_migration', proficiency: 85, category: 'account' },
      ],
      languages: ['en', 'zh'],
      certifications: ['CRM Certified'],
      yearsOfExperience: 3,
    },
    maxLoad: 5,
    isActive: true,
  },

  // Product Support Team
  {
    email: 'emily.product@ticketai.com',
    name: 'Emily Brown',
    role: 'AGENT' as const,
    department: 'PRODUCT_SUPPORT',
    skills: {
      skills: [
        { name: 'feature_requests', proficiency: 92, category: 'product' },
        { name: 'product_bugs', proficiency: 88, category: 'product' },
        { name: 'user_guidance', proficiency: 90, category: 'product' },
      ],
      languages: ['en'],
      certifications: ['Product Management'],
      yearsOfExperience: 4,
    },
    maxLoad: 5,
    isActive: true,
  },

  // Managers (for escalation)
  {
    email: 'james.manager@ticketai.com',
    name: 'James Wilson',
    role: 'MANAGER' as const,
    department: 'TECHNICAL_SUPPORT',
    skills: {
      skills: [
        { name: 'team_leadership', proficiency: 98, category: 'management' },
        { name: 'escalation_handling', proficiency: 95, category: 'management' },
      ],
      languages: ['en'],
      yearsOfExperience: 8,
    },
    maxLoad: 10,
    isActive: true,
  },
];

export async function seedDefaultEmployees(): Promise<void> {
  logger.info('Seeding default employees...');

  for (const employee of defaultEmployees) {
    try {
      const existing = await User.findOne({ where: { email: employee.email } });

      if (!existing) {
        await User.create({
          ...employee,
          currentLoad: 0,
        });
        logger.info(`Created: ${employee.name} (${employee.department})`);
      } else {
        logger.info(`Skipped: ${employee.name} (already exists)`);
      }
    } catch (error) {
      logger.error(`Failed to create ${employee.name}`, { error: (error as Error).message });
    }
  }

  logger.info('Default employees seeding completed');
}
```

### 4. Update Server Boot Process

**File:** `ai-ticket-core-server/src/boot/index.ts`

```typescript
import { seedDefaultEmployees } from './seed-default-employees';
import { logger } from '../logger';

export async function bootstrap(): Promise<void> {
  logger.info('Starting server bootstrap...');

  await seedDefaultEmployees();

  logger.info('Bootstrap completed');
}
```

**File:** `ai-ticket-core-server/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { logger } from './logger';
import { errorHandler } from './rest/middlewares/error-handler';
import { ticketRoutes } from './rest/modules/tickets/v1/routes';
import { teamRoutes } from './rest/modules/teams/v1/routes';
import { auditRoutes } from './rest/modules/audit/v1/routes';
import { bootstrap } from './boot';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: config.serviceName, timestamp: new Date().toISOString() });
});

app.use('/v1/tickets', ticketRoutes);
app.use('/v1/teams', teamRoutes);
app.use('/v1/audit', auditRoutes);

app.use(errorHandler);

bootstrap()
  .then(() => {
    app.listen(config.port, () => {
      logger.info(`Core server listening on port ${config.port}`);
    });
  })
  .catch((err) => {
    logger.error('Bootstrap failed, server not started', { error: (err as Error).message });
    process.exit(1);
  });

export default app;
```

### 5. Agent Routing (in Processor Server)

The routing logic belongs in `ai-ticket-processor-server` under the triage module, not in core-server.

**File:** `ai-ticket-processor-server/src/rest/modules/triage/v1/services/agent-routing.ts`

```typescript
import { User } from '@ai-ticket/shared-schema';

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

export async function findBestAgent(department: string, requiredSkills: string[]): Promise<User | null> {
  const agents = await User.findAll({
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
```

---

## File Structure Changes

```
ai-ticket-shared-schema/src/
├── enums.ts                             # ✏️ MODIFIED (add Department enum)
└── schema/main-server/
    ├── models/User.ts                   # ✏️ MODIFIED (add fields)
    └── migrations/
        └── 20240101000010-add-employee-fields.ts  # 🆕 NEW

ai-ticket-core-server/src/
├── index.ts                             # ✏️ MODIFIED (add bootstrap call)
├── boot/
│   ├── index.ts                         # 🆕 NEW (bootstrap entry)
│   └── seed-default-employees.ts        # 🆕 NEW

ai-ticket-processor-server/src/rest/modules/triage/v1/services/
└── agent-routing.ts                     # 🆕 NEW
```

---

## Installation Steps

### Step 1: Update Enums + Schema
```bash
# Add Department enum to ai-ticket-shared-schema/src/enums.ts
# Add fields to ai-ticket-shared-schema/src/schema/main-server/models/User.ts
# Add migration file
cd ai-ticket-shared-schema
npx ts-node ../../node_modules/.bin/sequelize db:migrate
```

### Step 2: Create Boot Files
```bash
mkdir -p ai-ticket-core-server/src/boot
touch ai-ticket-core-server/src/boot/index.ts
touch ai-ticket-core-server/src/boot/seed-default-employees.ts
```

### Step 3: Test Seeding
```bash
# Build shared packages first (per AGENTS.md convention)
npm run build

# Start core server
cd ai-ticket-core-server
npm run dev

# Should see:
# [core-server] info: Seeding default employees...
# [core-server] info: Created: Alex Chen (TECHNICAL_SUPPORT)
# [core-server] info: Created: Maria Garcia (FINANCE_SUPPORT)
# ...
```

### Step 4: Verify in Database
```sql
SELECT email, name, department, skills FROM "users";
-- Should return 8+ rows
```

---

## How AI Uses This Data

### Skill Matching Example
```
Ticket: "Need refund for duplicate charge"
requiredSkills = ["refund_processing", "payment_disputes"]

Agent Maria: refund_processing:98, payment_disputes:95
Match Score: 96.5  --> Selected

Agent John: chargeback_handling:92
Match Score: 46  --> Not selected
```

### Load Balancing Example
```
Agent Alex: currentLoad=5, maxLoad=5 (100% busy)
Agent Sarah: currentLoad=2, maxLoad=5 (40% busy)
New ticket --> Assigned to Sarah (load balancing)
```

---

## Default Employees Summary

| Name | Department | Key Skills | Max Load |
|------|------------|------------|----------|
| Alex Chen | Technical | API, Errors, Performance | 5 |
| Sarah Johnson | Technical | Mobile, DB, Security | 5 |
| Maria Garcia | Finance | Refunds, Disputes, Invoices | 5 |
| John Smith | Finance | Chargebacks, Gateways, Tax | 5 |
| David Kim | Account | Upgrades, Retention, Profiles | 5 |
| Lisa Wong | Account | Onboarding, Billing, Data | 5 |
| Emily Brown | Product | Features, Bugs, Guidance | 5 |
| James Wilson | Management | Leadership, Escalations | 10 |

---

## Important Notes

### Production Safety
```typescript
// In seed function, skip if production DB already has users
if (process.env.NODE_ENV === 'production') {
  const count = await User.count();
  if (count > 0) {
    logger.info('Production DB already has users, skipping seed');
    return;
  }
}
```

### Environment Variables
```bash
# Add to ai-ticket-core-server/.env
SEED_DEFAULT_EMPLOYEES=true   # Enable/disable seeding
SKIP_SEED_ON_EXISTING=true    # Skip if users already exist
```

---

## Checklist

- [ ] Added `Department` enum to `ai-ticket-shared-schema/src/enums.ts`
- [ ] Added fields to `User` model (`department`, `skills`, `currentLoad`, `maxLoad`)
- [ ] Created migration in shared-schema
- [ ] Ran migration
- [ ] Created `seed-default-employees.ts` in core-server boot
- [ ] Created `boot/index.ts` and updated `src/index.ts`
- [ ] Built shared packages (`npm run build` from root)
- [ ] Tested seeding on fresh database
- [ ] Added production safety check
- [ ] Created agent routing in processor-server triage module

---

**Document Version:** 2.0
**Last Updated:** June 2026
