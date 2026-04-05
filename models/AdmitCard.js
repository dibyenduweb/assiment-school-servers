const mongoose = require('mongoose');

const admitCardSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  academicYear: String,
  examType: String,
  examName: String,
  examStartDate: Date,
  examEndDate: Date,
  studentName: String,
  className: String,
  section: String,
  dateOfBirth: Date,
  passportPhoto: String,
  cardNumber: {
    type: String,
    unique: true
  },
  qrCode: String,
  pdfUrl: String,
  subjects: [{
    subjectName: String,
    examDate: Date,
    examTime: String,
    venue: String
  }],
  generated: {
    type: Boolean,
    default: false
  },
  downloaded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdmitCard', admitCardSchema);