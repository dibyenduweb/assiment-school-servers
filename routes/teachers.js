const express = require('express');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const router = express.Router();

// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private (Admin)
router.get('/', protect, authorize('admin', 'super_admin', 'teacher'), async (req, res) => {
  try {
    const { subject, search } = req.query;
    let query = {};

    if (subject) query.subject = subject;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(query).populate('userId', 'email role isActive');
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/teachers/me
// @desc    Get current teacher profile
// @access  Private (Teacher)
router.get('/me', protect, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id }).populate('userId', 'email role');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('userId', 'email role isActive');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private (Admin)
router.post('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, dateOfBirth, gender,
      qualification, experience, subject, assignedClasses, password
    } = req.body;

    // Check if teacher exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Teacher with this email already exists' });
    }

    // Create user account
    const user = await User.create({
      email,
      password: password || 'teacher123',
      role: 'teacher'
    });

    // Create teacher
    const teacher = await Teacher.create({
      userId: user._id,
      firstName,
      lastName: lastName || '',
      email,
      phone,
      dateOfBirth,
      gender,
      qualification,
      experience: experience || 0,
      subject,
      assignedClasses: assignedClasses || [],
      joiningDate: new Date()
    });

    // Send email notification
    try {
      await sendEmail({
        email: user.email,
        subject: 'Teacher Account Created - Ramakrishna Vidya Mandir',
        message: `<h1>Welcome to Ramakrishna Vidya Mandir</h1>
          <p>Dear ${firstName},</p>
          <p>Your teacher account has been created successfully.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password || 'teacher123'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Assigned Classes:</strong> ${assignedClasses?.join(', ') || 'Not assigned yet'}</p>
          <p>Please login and change your password immediately.</p>
          <p>Best regards,<br>School Administration</p>`
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({ success: true, message: 'Teacher created successfully', data: teacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher profile
// @access  Private (Admin/Teacher - own profile)
router.put('/:id', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      if (!teacher.userId.equals(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    // If email is being updated, check for duplicates and update User collection
    if (req.body.email && req.body.email !== teacher.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      
      // Update email in User collection
      await User.findByIdAndUpdate(teacher.userId, { email: req.body.email });
    }

    // Update teacher document
    const updated = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('userId', 'email role isActive');
    res.json({ success: true, message: 'Teacher updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/teachers/:id/status
// @desc    Update teacher status
// @access  Private (Admin)
router.put('/:id/status', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await User.findByIdAndUpdate(teacher.userId, { isActive: req.body.isActive });

    res.json({ success: true, message: 'Teacher status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Delete teacher
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId);
    }

    await Teacher.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;