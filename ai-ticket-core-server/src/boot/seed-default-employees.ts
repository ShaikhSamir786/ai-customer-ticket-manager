import { Employee } from '@ai-ticket/shared-schema';
import { logger } from '../logger';

const defaultEmployees = [
  {
    email: 'alex.tech@ticketai.com',
    name: 'Alex Chen',
    role: 'AGENT',
    department: 'technical_support',
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
    role: 'AGENT',
    department: 'technical_support',
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
  {
    email: 'maria.finance@ticketai.com',
    name: 'Maria Garcia',
    role: 'AGENT',
    department: 'finance_support',
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
    role: 'AGENT',
    department: 'finance_support',
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
  {
    email: 'david.account@ticketai.com',
    name: 'David Kim',
    role: 'AGENT',
    department: 'account_management',
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
    role: 'AGENT',
    department: 'account_management',
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
  {
    email: 'emily.product@ticketai.com',
    name: 'Emily Brown',
    role: 'AGENT',
    department: 'product_support',
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
  {
    email: 'james.manager@ticketai.com',
    name: 'James Wilson',
    role: 'MANAGER',
    department: 'technical_support',
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
      const existing = await Employee.findOne({ where: { email: employee.email } });

      if (!existing) {
        await Employee.create({
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
