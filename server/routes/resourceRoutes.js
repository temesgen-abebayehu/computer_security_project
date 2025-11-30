import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkTimeAccess } from '../middleware/accessControlMiddleware.js';
import {
  createResource,
  getResource,
  shareResource,
  getAllResources
} from '../controllers/resourceController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getAllResources)
  .post(createResource);

router.route('/:id')
  // RuBAC: Only allow access between 9 AM and 5 PM (17:00)
  // Note: This is a strict rule. Admins are bypassed in the middleware.
  .get(checkTimeAccess(9, 17), getResource);

router.route('/:id/share')
  .put(shareResource);

export default router;
