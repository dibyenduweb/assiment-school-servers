const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  class: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  chapter: String,
  topic: String,
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'ppt', 'video', 'image', 'other'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: Number,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  academicYear: String,
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);