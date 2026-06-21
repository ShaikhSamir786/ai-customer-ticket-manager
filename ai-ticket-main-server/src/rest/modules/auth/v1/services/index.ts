import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios, { isAxiosError } from 'axios';
import config from '../../../../../config';
import { UnauthorizedError, ValidationError } from '@ai-ticket/shared-lib';
import { logger } from '../../../../../logger';
import type { LoginInput, RegisterInput } from '../../../../../types/dto';

const JWT_EXPIRES_IN = (config.jwtExpiresIn || '7d') as jwt.SignOptions['expiresIn'];

export async function login(data: LoginInput) {
  if (!data.email || !data.password) {
    throw new ValidationError('Email and password are required');
  }

  try {
    const response = await axios.get(`${config.coreServerUrl}/v1/auth/verify`, {
      params: { email: data.email },
      timeout: 10000,
    });

    const user = response.data;
    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, teamId: user.teamId },
      config.jwtSecret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.teamId },
    };
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) throw err;
    if (isAxiosError(err) && err.response?.status === 401) throw new UnauthorizedError('Invalid credentials');
    logger.error('Login error', { error: err instanceof Error ? err.message : String(err) });
    throw new UnauthorizedError('Authentication service unavailable');
  }
}

export async function register(data: RegisterInput) {
  if (!data.name || !data.email || !data.password) {
    throw new ValidationError('Name, email, and password are required');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const response = await axios.post(
    `${config.coreServerUrl}/v1/auth/register`,
    { ...data, passwordHash },
    { timeout: 10000 },
  );

  return response.data;
}





