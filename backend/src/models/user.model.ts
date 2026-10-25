export const ROLES = ['admin', 'employee'] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
}

export type UpdateUserData = Partial<CreateUserData>;

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}
