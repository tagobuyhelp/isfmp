import { Router } from 'express';
import { verifyMsg91AccessToken } from '../controllers/otp.controller.js';

const router = Router();

router.post('/msg91/verify-token', verifyMsg91AccessToken);

export default router;
