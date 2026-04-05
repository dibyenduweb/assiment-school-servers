const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  type: {
    type: String,
    enum: ['admission_fee', 'tuition_fee', 'exam_fee', 'annual_fee', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  utrNumber: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paymentMode: {
    type: String,
    default: 'UPI'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'failed'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  rejectionReason: String,
  receiptNumber: String,
  academicYear: String,
  remarks: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);