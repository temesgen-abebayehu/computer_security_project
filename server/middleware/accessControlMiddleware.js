import logger from '../config/logger.js';

// MAC: Mandatory Access Control
// Enforce strict access policies based on sensitivity levels
export const checkSensitivity = (requiredLevel) => {
  return (req, res, next) => {
    const userLevel = req.user.sensitivityLevel;
    
    const levels = {
      'public': 0,
      'internal': 1,
      'confidential': 2
    };

    if (levels[userLevel] < levels[requiredLevel]) {
      logger.warn(`MAC Access Denied: User ${req.user.id} (${userLevel}) tried to access ${requiredLevel} resource`);
      return res.status(403).json({
        success: false,
        error: `Access Denied: Insufficient clearance level.`
      });
    }
    next();
  };
};

// RuBAC: Rule-Based Access Control
// Restrict access based on conditions like time
export const checkTimeAccess = (startHour, endHour) => {
  return (req, res, next) => {
    const currentHour = new Date().getHours();
    
    // Allow admins to bypass
    if (req.user.role === 'admin') return next();

    if (currentHour < startHour || currentHour >= endHour) {
      logger.warn(`RuBAC Access Denied: User ${req.user.id} tried to access outside allowed hours`);
      return res.status(403).json({
        success: false,
        error: `Access Denied: Resource only available between ${startHour}:00 and ${endHour}:00.`
      });
    }
    next();
  };
};

// ABAC: Attribute-Based Access Control
// Fine-grained control using attributes
export const checkAttributes = (requiredAttributes) => {
  return (req, res, next) => {
    // requiredAttributes is an object, e.g., { department: 'HR', status: 'active' }
    
    const user = req.user;
    let isAllowed = true;

    for (const key in requiredAttributes) {
      if (user[key] !== requiredAttributes[key]) {
        isAllowed = false;
        break;
      }
    }

    if (!isAllowed) {
      logger.warn(`ABAC Access Denied: User ${req.user.id} failed attribute check`);
      return res.status(403).json({
        success: false,
        error: `Access Denied: User attributes do not match required policy.`
      });
    }
    next();
  };
};
