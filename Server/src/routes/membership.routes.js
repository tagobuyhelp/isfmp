import { Router } from 'express';

import {
    createMembership,
    checkMemberPaymentStatus,
    renewMembership,
    cancelMembership,
    getMembershipDetails,
    listAllMemberships,
    updateExistingMemberships
} from '../controllers/membership.controller.js';

const router = Router();

// Route to create membership fees
router.route('/membership').post(createMembership);

router.post("/update-existing", updateExistingMemberships);

// Route to check payment status
router.route('/membership/payment/status/:merchantTransactionId').post(checkMemberPaymentStatus);

// Route to renew membership
router.route('/membership/renew').post(renewMembership);

// Route to cancel membership
router.route('/membership/cancel').post(cancelMembership);

// Route to get membership details
router.route('/membership/:memberId').get(getMembershipDetails);

// Admin route to list all memberships
router.route('/admin/memberships').get(listAllMemberships);

export default router;
