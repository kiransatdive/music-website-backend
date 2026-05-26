import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import Artist from '../models/Artist.js';
import type { ArtistAttributes } from '../models/Artist.js';
import { sendOtpEmail } from './emailService.js';
import type { OtpEmailPurpose } from './emailService.js';

const ARTIST_ROLE = 'artist';
const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_JWT_EXPIRES_IN = '7d';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ArtistTokenPayload = {
  id: number;
  email: string;
  role: string;
};

type RegisterArtistInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  label?: string;
  role?: string;
};

type LoginArtistInput = {
  email: string;
  password: string;
};

type OtpInput = {
  email: string;
  otp: string;
};

type ResetPasswordInput = OtpInput & {
  password: string;
};

type EditArtistProfileInput = {
  artistId: number;
  bio?: string;
  genre?: string;
  profileImage?: string;
  socialLinks?: object;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
};

type EditableArtistProfileFields = Pick<
  ArtistAttributes,
  | 'bio'
  | 'genre'
  | 'profileImage'
  | 'socialLinks'
  | 'accountHolderName'
  | 'bankName'
  | 'accountNumber'
  | 'ifscCode'
  | 'branchName'
  | 'upiId'
>;

export class ServiceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

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

function normalizePhone(phone: string): string {
  return phone.trim();
}

function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

async function findArtistByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  assertValidEmail(normalizedEmail);

  return Artist.findOne({
    where: { email: normalizedEmail },
  });
}

async function generateAndSendArtistOtp(
  artist: Artist,
  purpose: OtpEmailPurpose,
) {
  const previousOtp = artist.otp ?? null;
  const otp = generateOtp();

  artist.otp = otp;
  await artist.save();

  try {
    await sendOtpEmail(artist.email, otp, purpose);
  } catch {
    artist.otp = previousOtp;
    await artist.save();
    throw new ServiceError('Unable to send OTP email. Please try again.', 502);
  }

  return {};
}

function signArtistToken(artist: Artist): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ??
    process.env.JWT_EXPIRE ??
    DEFAULT_JWT_EXPIRES_IN) as SignOptions['expiresIn'];
  const payload: ArtistTokenPayload = {
    id: artist.id,
    email: artist.email,
    role: artist.role ?? ARTIST_ROLE,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  });
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0;
  }

  return value !== undefined && value !== null;
}

function getProfileStatus(artist: Artist): 'complete' | 'pending' {
  const requiredProfileFields = [
    artist.bio,
    artist.genre,
    artist.profileImage,
    artist.socialLinks,
    artist.accountHolderName,
    artist.bankName,
    artist.accountNumber,
    artist.ifscCode,
    artist.branchName,
    artist.upiId,
  ];

  return requiredProfileFields.every(hasValue) ? 'complete' : 'pending';
}

function artistResponse(artist: Artist) {
  return {
    id: artist.id,
    name: artist.name,
    email: artist.email,
    phone: artist.phone,
    label: artist.label ?? null,
    role: artist.role,
    isVerified: artist.isVerified,
    bio: artist.bio,
    genre: artist.genre,
    profileImage: artist.profileImage,
    socialLinks: artist.socialLinks,
    accountHolderName: artist.accountHolderName,
    bankName: artist.bankName,
    accountNumber: artist.accountNumber,
    ifscCode: artist.ifscCode,
    branchName: artist.branchName,
    upiId: artist.upiId,
    profileStatus: getProfileStatus(artist),
  };
}

function assignIfDefined<T extends keyof EditArtistProfileInput>(
  updates: Partial<EditableArtistProfileFields>,
  key: T,
  value: EditArtistProfileInput[T],
) {
  if (value !== undefined) {
    updates[key as keyof EditableArtistProfileFields] = value as never;
  }
}

export async function registerArtistService(input: RegisterArtistInput) {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);
  const existingArtist = await findArtistByEmail(normalizedEmail);

  if (existingArtist) {
    throw new ServiceError('Artist with this email already exists', 409);
  }

  const existingPhone = await Artist.findOne({
    where: { phone: normalizedPhone },
  });

  if (existingPhone) {
    throw new ServiceError('Artist with this phone already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
  const otp = generateOtp();

  const artist = await Artist.create({
    name: input.name,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hashedPassword,
    label: input.label,
    role: input.role ?? ARTIST_ROLE,
    otp,
    isVerified: false,
  });

  try {
    await sendOtpEmail(artist.email, otp, 'email verification');
  } catch {
    await artist.destroy();
    throw new ServiceError('Unable to send verification email. Please try again.', 502);
  }

  return {
    artist: artistResponse(artist),
  };
}

export function verifyArtistToken(token: string): ArtistTokenPayload {
  try {
    return jwt.verify(token, getJwtSecret()) as ArtistTokenPayload;
  } catch {
    throw new ServiceError('Invalid or expired token', 401);
  }
}

export async function getArtistProfileService(artistId: number) {
  const artist = await Artist.findByPk(artistId);

  if (!artist) {
    throw new ServiceError('Artist not found', 404);
  }

  return {
    artist: artistResponse(artist),
  };
}

export async function verifyArtistOtpService(input: OtpInput) {
  const artist = await findArtistByEmail(input.email);

  if (!artist || artist.otp !== input.otp) {
    throw new ServiceError('Invalid email or OTP', 400);
  }

  artist.isVerified = true;
  artist.otp = null;
  await artist.save();

  return {
    artist: artistResponse(artist),
    token: signArtistToken(artist),
  };
}

export async function resendArtistOtpService(email: string) {
  const artist = await findArtistByEmail(email);

  if (!artist) {
    throw new ServiceError('Artist not found', 404);
  }

  return generateAndSendArtistOtp(artist, 'email verification');
}

export async function loginArtistService(input: LoginArtistInput) {
  const artist = await findArtistByEmail(input.email);

  if (!artist) {
    throw new ServiceError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, artist.password);

  if (!isPasswordValid) {
    throw new ServiceError('Invalid email or password', 401);
  }

  if (!artist.isVerified) {
    throw new ServiceError('Please verify your email before login', 403);
  }

  return {
    artist: artistResponse(artist),
    token: signArtistToken(artist),
  };
}

export async function forgotArtistPasswordService(email: string) {
  const artist = await findArtistByEmail(email);

  if (!artist) {
    return {};
  }

  return generateAndSendArtistOtp(artist, 'password reset');
}

export async function resetArtistPasswordService(input: ResetPasswordInput) {
  const artist = await findArtistByEmail(input.email);

  if (!artist || artist.otp !== input.otp) {
    throw new ServiceError('Invalid email or OTP', 400);
  }

  artist.password = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
  artist.otp = null;
  await artist.save();
}

export async function editArtistProfileService(input: EditArtistProfileInput) {
  const artist = await Artist.findByPk(input.artistId);

  if (!artist) {
    throw new ServiceError('Artist not found', 404);
  }

  const updates: Partial<EditableArtistProfileFields> = {};

  assignIfDefined(updates, 'bio', input.bio);
  assignIfDefined(updates, 'genre', input.genre);
  assignIfDefined(updates, 'profileImage', input.profileImage);
  assignIfDefined(updates, 'socialLinks', input.socialLinks);
  assignIfDefined(updates, 'accountHolderName', input.accountHolderName);
  assignIfDefined(updates, 'bankName', input.bankName);
  assignIfDefined(updates, 'accountNumber', input.accountNumber);
  assignIfDefined(updates, 'ifscCode', input.ifscCode);
  assignIfDefined(updates, 'branchName', input.branchName);
  assignIfDefined(updates, 'upiId', input.upiId);

  await artist.update(updates);

  return {
    artist: artistResponse(artist),
  };
}
