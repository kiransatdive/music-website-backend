import { Router } from 'express';
import { loginAdmin } from '../controllers/adminAuthController.js';

const router = Router();

router.post('/admin/login', loginAdmin);

export default router;
