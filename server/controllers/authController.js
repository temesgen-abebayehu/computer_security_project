import crypto from 'crypto';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import sendEmail from '../utils/sendEmail.js';
import verifyCaptcha from '../utils/captcha.js';
import logger from '../config/logger.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, username, email, password, captchaToken, otpEnabled } = req.body;

    // Check if user already exists (email or username)
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      logger.warn(`Registration failed: User already exists with email ${email} or username ${username}`);
      return res.status(400).json({ success: false, error: 'User already exists with that email or username' });
    }

    // check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character' });
    }

    // Verify Captcha
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      logger.warn(`Registration failed: Invalid Captcha for email ${email}`);
      return res.status(400).json({ success: false, error: 'Invalid Captcha' });
    }

    // Create user
    const user = await User.create({
      name,
      username,
      email,
      password,
      role: 'user', // Default role
      otpEnabled: otpEnabled || false
    });

    // Generate verification token
    const verificationToken = user.getVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification url
    // In a real app, this would be a frontend URL. For API testing, we return the token or use a backend route.
    const verifyUrl = `http://localhost:3000/verify-email/${req.body.verificationToken || verificationToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the registration of an account.\n\nPlease click the link below to verify your email: \n${verifyUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message
      });

      logger.info(`User registered: ${user.id}. Verification email sent.`);

      res.status(200).json({
        success: true,
        data: 'Email sent',
        verificationToken // Returning for testing purposes
      });
    } catch (err) {
      console.error(err);
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      logger.error(`Email could not be sent to ${user.email}`);
      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email/username and password' });
    }

    // Check for user by email OR username
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }]
    }).select('+password +otpEnabled +loginAttempts +lockUntil');

    if (!user) {
      logger.warn(`Login failed: Invalid credentials for identifier ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      logger.warn(`Login failed: Account locked for user ${user.id}`);
      return res.status(403).json({
        success: false,
        error: 'Account is locked. Please try again later.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 mins
        user.loginAttempts = 0;
        logger.warn(`Account locked due to failed login attempts: ${user.id}`);
      }
      await user.save();
      logger.warn(`Login failed: Incorrect password for user ${user.id}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Check for MFA
    if (user.otpEnabled) {
      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Save OTP to DB
      await Otp.create({
        userId: user._id,
        otp: otpCode
      });

      // Send OTP via Email
      const message = `Your login OTP is: ${otpCode}. It expires in 5 minutes.`;
      try {
        await sendEmail({
          email: user.email,
          subject: 'Login OTP',
          message
        });

        logger.info(`MFA OTP sent to user ${user.id}`);
        return res.status(200).json({
          success: true,
          mfaRequired: true,
          userId: user._id,
          message: 'OTP sent to email'
        });
      } catch (err) {
        logger.error(err);
        return res.status(500).json({ success: false, error: 'Email could not be sent' });
      }
    }

    logger.info(`User logged in: ${user.id}`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const validOtp = await Otp.findOne({ userId, otp });

    if (!validOtp) {
      logger.warn(`MFA failed: Invalid OTP for user ${userId}`);
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    const user = await User.findById(userId);

    // Delete used OTP
    await Otp.deleteOne({ _id: validOtp._id });

    logger.info(`MFA verified for user ${user.id}`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Email
// @route   GET /api/auth/verifyemail/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();

    logger.info(`Email verified for user ${user.id}`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    logger.info(`User details updated: ${user.id}`);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      logger.warn(`Password update failed: Incorrect current password for user ${user.id}`);
      return res.status(401).json({ success: false, error: 'Incorrect current password' });
    }

    user.password = req.body.newPassword;
    await user.save();

    logger.info(`Password updated for user ${user.id}`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info(`User role updated: ${user.id} to ${role} by admin ${req.user.id}`);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  logger.info(`User logged out`);
  res.status(200).json({
    success: true,
    data: {}
  });
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_EXPIRE.match(/\d+/)[0]) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
