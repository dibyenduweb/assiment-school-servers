const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['exam', 'holiday', 'event', 'general', 'admission', 'result'],
    default: 'general'
  },
  visibleTo: {
    type: String,
    enum: ['all', 'students', 'parents', 'teachers', 'admin'],
    default: 'all'
  },
  targetClass: [String],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', noticeSchema);