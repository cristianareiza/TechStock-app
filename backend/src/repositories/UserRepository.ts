import type { DB, SqlParams } from '../database/connection.js';
import type {
  CreateUserData,
  Role,
  UpdateUserData,
  User,
  UserWithPassword,
} from '../models/user.model.js';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  active: number;
  created_at: string;
  updated_at: string;
}

const COLUMN_MAP: Record<keyof UpdateUserData, string> = {
  name: 'name',
  email: 'email',
  passwordHash: 'password_hash',
  role: 'role',
  active: 'active',
};

export class UserRepository {
  constructor(private readonly db: DB) {}

  findAll(): User[] {
    const rows = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC, id DESC').all() as unknown as UserRow[];
    return rows.map((row) => this.toUser(row));
  }

  findById(id: number): User | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow | undefined;
    return row ? this.toUser(row) : undefined;
  }

  findByEmailWithPassword(email: string): UserWithPassword | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined;
    return row ? { ...this.toUser(row), passwordHash: row.password_hash } : undefined;
  }

  existsByEmail(email: string, excludeId?: number): boolean {
    const row = this.db
      .prepare('SELECT 1 FROM users WHERE email = ? AND id != ?')
      .get(email, excludeId ?? 0);
    return row !== undefined;
  }

  countActiveAdmins(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND active = 1")
      .get() as unknown as { total: number };
    return row.total;
  }

  create(data: CreateUserData): User {
    const result = this.db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, active)
         VALUES (@name, @email, @passwordHash, @role, @active)`,
      )
      .run({ ...data, active: data.active ? 1 : 0 } as unknown as SqlParams);
    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(id: number, data: UpdateUserData): User | undefined {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined) as [
      keyof UpdateUserData,
      unknown,
    ][];

    if (entries.length > 0) {
      const assignments = entries.map(([key]) => `${COLUMN_MAP[key]} = @${key}`).join(', ');
      const params = Object.fromEntries(
        entries.map(([key, value]) => [key, typeof value === 'boolean' ? Number(value) : value]),
      );
      this.db
        .prepare(`UPDATE users SET ${assignments}, updated_at = datetime('now') WHERE id = @id`)
        .run({ ...params, id } as SqlParams);
    }

    return this.findById(id);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
  }

  private toUser(row: UserRow): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      active: row.active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
