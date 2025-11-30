import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  register,
  login,
  getMe,
  logout,
  verifyOtp,
  verifyEmail,
  updateDetails,
  updatePassword,
  getAllUsers,
  updateUserRole
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/verifyemail/:token', verifyEmail);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Admin routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);

export default router;
