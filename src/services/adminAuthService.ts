import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { ServiceError } from './artistAuthService.js';

const ADMIN_ROLE = 'admin';
const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_JWT_EXPIRES_IN = '7d';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AdminTokenPayload = {
  id: number;
  email: string;
  role: string;
};

type AdminLoginInput = {
  email: string;
  password: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new ServiceError('JWT_SECRET is required in production', 500);
  }

  return secret ?? 'music_backend_secret';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertValidEmail(email: string): void {
  if (!EMAIL_PATTERN.test(email)) {
    throw new ServiceError('Invalid email address', 400);
  }
}

function adminResponse(admin: Admin) {
  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  };
}

function signAdminToken(admin: Admin): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ??
    process.env.JWT_EXPIRE ??
    DEFAULT_JWT_EXPIRES_IN) as SignOptions['expiresIn'];

  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
    getJwtSecret(),
    { expiresIn },
  );
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AdminTokenPayload;

    if (payload.role !== ADMIN_ROLE) {
      throw new ServiceError('Admin access only', 403);
    }

    return payload;
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }

    throw new ServiceError('Invalid or expired token', 401);
  }
}

export async function seedDefaultAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new ServiceError('ADMIN_EMAIL and ADMIN_PASSWORD are required', 500);
  }

  const email = normalizeEmail(adminEmail);
  assertValidEmail(email);

  const existingAdmin = await Admin.findOne({ where: { email } });

  if (existingAdmin) {
    existingAdmin.role = ADMIN_ROLE;
    await existingAdmin.save();
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);

  await Admin.create({
    email,
    password: hashedPassword,
    role: ADMIN_ROLE,
  });
}

export async function loginAdminService(input: AdminLoginInput) {
  const email = normalizeEmail(input.email);
  assertValidEmail(email);

  const admin = await Admin.findOne({ where: { email } });

  if (!admin) {
    throw new ServiceError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, admin.password);

  if (!isPasswordValid) {
    throw new ServiceError('Invalid email or password', 401);
  }

  return {
    admin: adminResponse(admin),
    token: signAdminToken(admin),
  };
}
