
import { login, register } from '../../../rest/modules/auth/v1/services';
import { formatAppError } from '../../helpers';

export const userMutations = {
  login: async (_: unknown, args: { input: { email: string; password: string } }) => {
    try { return await login(args.input); }
    catch (err) { formatAppError(err); }
  },
  register: async (_: unknown, args: { input: { name: string; email: string; password: string; role?: string; teamId?: string } }) => {
    try { return await register(args.input); }
    catch (err) { formatAppError(err); }
  },
};
