import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    validateTokens,
} from '../controllers/user.controller.js';

const router = Router();

router.route('/register').post(verifyJWT, registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route('/validate-tokens').post(validateTokens);


export default router;