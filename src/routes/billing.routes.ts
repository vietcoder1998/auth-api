import { Router } from 'express';
import * as billingController from '../controllers/billing.controller';

const router = Router();

router.post('/', billingController.createBilling);
router.get('/', billingController.getBillings);
router.get('/:id', billingController.getBillingById);
router.put('/:id', billingController.updateBilling);
router.delete('/:id', billingController.deleteBilling);

export default router;
