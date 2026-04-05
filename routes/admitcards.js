const express = require('express');
const AdmitCard = require('../models/AdmitCard');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const QRCode = require('qrcode');
const router = express.Router();

// @route   GET /api/admitcards
// @desc    Get all admit cards
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        query.studentId = student._id;
      }
    }

    const admitCards = await AdmitCard.find(query);
    res.json({ success: true, count: admitCards.length, data: admitCards });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admitcards
// @desc    Create admit card
// @access  Private (Admin)
router.post('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.body.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Generate QR Code
    const qrData = `Roll: ${student.rollNumber}\nName: ${student.firstName}\nClass: ${student.class}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const admitCard = await AdmitCard.create({
      ...req.body,
      studentName: `${student.firstName} ${student.lastName || ''}`,
      className: student.class,
      section: student.section,
      dateOfBirth: student.dateOfBirth,
      passportPhoto: student.passportPhoto,
      qrCode,
      cardNumber: 'AC' + Date.now(),
      generated: true
    });

    res.status(201).json({ success: true, data: admitCard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admitcards/:id
// @desc    Delete admit card
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const admitCard = await AdmitCard.findByIdAndDelete(req.params.id);
    if (!admitCard) {
      return res.status(404).json({ success: false, message: 'Admit card not found' });
    }
    res.json({ success: true, message: 'Admit card deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admitcards/public
// @desc    Get admit card by roll number and DOB (Public)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { rollNumber, dateOfBirth } = req.query;

    if (!rollNumber || !dateOfBirth) {
      return res.status(400).json({ message: 'Roll number and date of birth are required' });
    }

    const admitCard = await AdmitCard.findOne({ 
      rollNumber,
      dateOfBirth: new Date(dateOfBirth)
    });

    if (!admitCard) {
      return res.status(404).json({ message: 'Admit card not found' });
    }

    // Update downloaded count
    admitCard.downloaded = true;
    await admitCard.save();

    res.json({ success: true, data: admitCard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;