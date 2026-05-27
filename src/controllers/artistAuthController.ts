import { Request, Response } from 'express';
import type { ArtistRequest } from '../middleware/artistAuthMiddleware.js';
import {
  editArtistProfileService,
  forgotArtistPasswordService,
  getArtistProfileService,
  loginArtistService,
  registerArtistService,
  resendArtistOtpService,
  resetArtistPasswordService,
  ServiceError,
  verifyArtistOtpService,
} from '../services/artistAuthService.js';

// Error handler
function sendError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : fallbackMessage,
  });
}

function isMissing(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// Parse social links
function parseSocialLinks(value: unknown): object | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'object' && value !== null) {
    return value;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Invalid socialLinks');
    }

    return parsed;
  } catch {
    throw new ServiceError('socialLinks must be a valid JSON object', 400);
  }
}

// Register artist
export async function registerArtist(req: Request, res: Response) {
  try {
    const { name, email, password, phone, role, label } = req.body;

    if (
      isMissing(name) ||
      isMissing(email) ||
      isMissing(password) ||
      isMissing(phone)
    ) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password and phone are required',
      });
    }

    const data = await registerArtistService({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      label: optionalString(label),
      role,
    });

    return res.status(201).json({
      success: true,
      message: 'Artist registered successfully. Verify email with OTP.',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Registration failed');
  }
}

// Verify artist OTP
export async function verifyArtistOtp(req: Request, res: Response) {
  try {
    const { email, otp } = req.body;

    if (isMissing(email) || isMissing(otp)) {
      return res.status(400).json({
        success: false,
        message: 'email and otp are required',
      });
    }

    const data = await verifyArtistOtpService({
      email: email.trim(),
      otp: otp.trim(),
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'OTP verification failed');
  }
}

// Resend artist OTP
export async function resendArtistOtp(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (isMissing(email)) {
      return res.status(400).json({
        success: false,
        message: 'email is required',
      });
    }

    const data = await resendArtistOtpService(email.trim());

    return res.status(200).json({
      success: true,
      message: 'OTP generated successfully',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'OTP resend failed');
  }
}

// Login artist
export async function loginArtist(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (isMissing(email) || isMissing(password)) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const data = await loginArtistService({
      email: email.trim(),
      password,
    });

    return res.status(200).json({
      success: true,
      message: 'Artist logged in successfully',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Login failed');
  }
}

// Forgot artist password
export async function forgotArtistPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (isMissing(email)) {
      return res.status(400).json({
        success: false,
        message: 'email is required',
      });
    }

    const data = await forgotArtistPasswordService(email.trim());

    return res.status(200).json({
      success: true,
      message: 'Password reset OTP generated successfully',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Forgot password failed');
  }
}

// Reset artist password
export async function resetArtistPassword(req: Request, res: Response) {
  try {
    const { email, otp, password } = req.body;

    if (isMissing(email) || isMissing(otp) || isMissing(password)) {
      return res.status(400).json({
        success: false,
        message: 'email, otp and password are required',
      });
    }

    await resetArtistPasswordService({
      email: email.trim(),
      otp: otp.trim(),
      password,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    return sendError(res, error, 'Password reset failed');
  }
}

// Edit artist profile
export async function editArtistProfile(req: ArtistRequest, res: Response) {
  try {
    if (!req.artist) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const profileImage = req.file
      ? `/uploads/profile-images/${req.file.filename}`
      : undefined;

      const socialLinks = parseSocialLinks(req.body.socialLinks);

      // Validate social links against whitelist
      if (socialLinks) {
        const { URL } = require('url');
        const WhitelistDomain = require('../models/WhitelistDomain.js').default;

        for (const [platform, link] of Object.entries(socialLinks)) {
          if (typeof link === 'string' && link.trim() !== '') {
            try {
              const urlObj = new URL(link);
              let domain = urlObj.hostname.replace(/^www\./, '');

              const isWhitelisted = await WhitelistDomain.findOne({
                where: {
                  domain,
                  status: 'APPROVED',
                  isActive: true,
                },
              });

              if (!isWhitelisted) {
                return res.status(400).json({
                  success: false,
                  message: `Link ${domain} is not whitelisted`,
                });
              }
            } catch (e) {
              return res.status(400).json({
                success: false,
                message: `Invalid URL format in social links`,
              });
            }
          }
        }
      }

      const data = await editArtistProfileService({
        artistId: req.artist.id,
        bio: optionalString(req.body.bio),
        genre: optionalString(req.body.genre),
        profileImage,
        socialLinks,
        accountHolderName: optionalString(req.body.accountHolderName),
        bankName: optionalString(req.body.bankName),
        accountNumber: optionalString(req.body.accountNumber),
        ifscCode: optionalString(req.body.ifscCode),
        branchName: optionalString(req.body.branchName),
        upiId: optionalString(req.body.upiId),
      });

    return res.status(200).json({
      success: true,
      message: 'Artist profile updated successfully',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Profile update failed');
  }
}

// Get artist profile
export async function getArtistProfile(req: ArtistRequest, res: Response) {
  try {
    if (!req.artist) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const data = await getArtistProfileService(req.artist.id);

    return res.status(200).json({
      success: true,
      message: 'Artist profile fetched successfully',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Profile fetch failed');
  }
}
