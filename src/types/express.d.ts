import type { PublicUser } from './user';

/**
 * Extiende Request de Express para tipar req.user tras authenticate().
 */
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
