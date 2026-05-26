import { Router } from 'express';
import {
  editArtistProfile,
  forgotArtistPassword,
  getArtistProfile,
  loginArtist,
  registerArtist,
  resendArtistOtp,
  resetArtistPassword,
  verifyArtistOtp,
} from '../controllers/artistAuthController.js';
import { authenticateArtist } from '../middleware/artistAuthMiddleware.js';
import { uploadProfileImage } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/artist/register', registerArtist);
router.post('/artist/verify-otp', verifyArtistOtp);
router.post('/artist/resend-otp', resendArtistOtp);
router.post('/artist/login', loginArtist);
router.post('/artist/forgot-password', forgotArtistPassword);
router.post('/artist/reset-password', resetArtistPassword);
router.get('/artist/profile', authenticateArtist, getArtistProfile);
router.put(
  '/artist/profile',
  authenticateArtist,
  uploadProfileImage.single('profileImage'),
  editArtistProfile,
);

export default router;
