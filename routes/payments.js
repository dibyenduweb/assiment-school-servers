const express = require('express');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private (Admin/Student)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        query.studentId = student._id;
      }
    }

    const payments = await Payment.find(query).populate('studentId', 'firstName lastName rollNumber class');
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/payments
// @desc    Create payment
// @access  Private (Student)
router.post('/', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const payment = await Payment.create({
      studentId: student._id,
      ...req.body
    });

    // Send email notification
    try {
      await sendEmail({
        email: req.user.email,
        subject: 'Payment Submitted',
        message: `<h1>Payment Submitted</h1>
          <p>Your payment has been submitted successfully.</p>
          <p><strong>Amount:</strong> ₹${req.body.amount}</p>
          <p><strong>UTR:</strong> ${req.body.utrNumber}</p>
          <p>Status: Pending Verification</p>`
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/payments/verify/:id
// @desc    Verify payment
// @access  Private (Admin)
router.put('/verify/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = req.body.status;
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = Date.now();
    payment.rejectionReason = req.body.rejectionReason || '';

    await payment.save();

    // Send email notification
    const student = await Student.findById(payment.studentId);
    if (student && student.parentEmail) {
      try {
        await sendEmail({
          email: student.parentEmail,
          subject: `Payment ${req.body.status === 'verified' ? 'Verified' : 'Rejected'}`,
          message: `<h1>Payment Update</h1>
            <p>Your payment of ₹${payment.amount} has been ${req.body.status}.</p>
            ${req.body.status === 'rejected' ? `<p>Reason: ${req.body.rejectionReason}</p>` : ''}`
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment details
// @access  Private (Admin/Student - own payment)
router.put('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || student._id.toString() !== payment.studentId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    // Only allow updates if not verified
    if (payment.status === 'verified') {
      return res.status(400).json({ success: false, message: 'Cannot update verified payment' });
    }

    const updated = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Payment updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete payment record
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;