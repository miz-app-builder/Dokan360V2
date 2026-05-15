import type { UserRole } from "@workspace/db";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  shopId: number;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}
