import Resource from '../models/Resource.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
export const getAllResources = async (req, res, next) => {
    try {
        let resources;

        if (req.user.role === 'admin') {
            // Admin sees all resources
            resources = await Resource.find();
        } else {
            // User sees resources they own OR are shared with them
            resources = await Resource.find({
                $or: [
                    { owner: req.user.id },
                    { 'sharedWith.user': req.user.id }
                ]
            });
        }

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a resource
// @route   POST /api/resources
// @access  Private
export const createResource = async (req, res, next) => {
    try {
        const { name, content, sensitivityLevel } = req.body;

        const resource = await Resource.create({
            name,
            content,
            sensitivityLevel,
            owner: req.user.id
        });

        res.status(201).json({
            success: true,
            data: resource
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a resource (Implements MAC & DAC)
// @route   GET /api/resources/:id
// @access  Private
export const getResource = async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ success: false, error: 'Resource not found' });
        }

        // 1. MAC Check (Mapped to Roles)
        const resourceLevels = { 'public': 0, 'internal': 1, 'confidential': 2 };
        const resourceLevel = resourceLevels[resource.sensitivityLevel];

        // Define Role Clearance
        // user: Public only
        // employee, manager: Internal & Public
        // hr, admin: Confidential, Internal & Public
        const roleClearance = {
            'user': 0,
            'employee': 1,
            'manager': 1,
            'hr': 2,
            'admin': 2
        };

        const userClearance = roleClearance[req.user.role] || 0;

        if (userClearance < resourceLevel) {
            logger.warn(`MAC Access Denied: User ${req.user.id} (${req.user.role}) tried to access ${resource.sensitivityLevel} resource ${resource.id}`);
            return res.status(403).json({ success: false, error: 'Access Denied: Your role does not have sufficient clearance for this resource.' });
        }

        // 2. DAC Check (Discretionary Access Control)
        // Allow if Owner OR Shared With OR Admin
        const isOwner = resource.owner.toString() === req.user.id;
        const isShared = resource.sharedWith.some(share => share.user.toString() === req.user.id);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isShared && !isAdmin) {
            logger.warn(`DAC Access Denied: User ${req.user.id} tried to access resource ${resource.id}`);
            return res.status(403).json({ success: false, error: 'Access Denied: You do not have permission to view this resource.' });
        }

        res.status(200).json({
            success: true,
            data: resource
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Share a resource (DAC)
// @route   PUT /api/resources/:id/share
// @access  Private (Owner only)
export const shareResource = async (req, res, next) => {
    try {
        const { userId, email, username, permission } = req.body;

        let resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ success: false, error: 'Resource not found' });
        }

        // Only owner can share
        if (resource.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized to share this resource' });
        }

        let targetUserId = userId;

        // If email or username provided, find the user
        if (!targetUserId && (email || username)) {
            const user = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (!user) {
                return res.status(404).json({ success: false, error: 'User to share with not found' });
            }
            targetUserId = user._id;
        }

        if (!targetUserId) {
            return res.status(400).json({ success: false, error: 'Please provide a userId, email, or username' });
        }

        // Check if already shared
        const alreadyShared = resource.sharedWith.find(share => share.user.toString() === targetUserId.toString());

        if (alreadyShared) {
            alreadyShared.permission = permission;
        } else {
            resource.sharedWith.push({ user: targetUserId, permission });
        }

        await resource.save();

        res.status(200).json({
            success: true,
            data: resource
        });
    } catch (err) {
        next(err);
    }
};
