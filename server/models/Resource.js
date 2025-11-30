import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // DAC: List of users who have access
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    }
  }],
  // MAC: Sensitivity Level
  sensitivityLevel: {
    type: String,
    enum: ['public', 'internal', 'confidential'],
    default: 'internal'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Resource', ResourceSchema);
