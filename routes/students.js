const express = require('express');
const Student = require('../models/Student');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const router = express.Router();

// @route   GET /api/students
// @desc    Get all students
// @access  Private (Admin/Teacher)
router.get('/', protect, async (req, res) => {
  try {
    const { class: studentClass, section, search } = req.query;
    let query = {};

    if (studentClass) query.class = studentClass;
    if (section) query.section = section;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).populate('userId', 'email');
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin)
router.post('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { 
      firstName, lastName, rollNumber, class: studentClass, section,
      dateOfBirth, gender, parentName, parentPhone, email, password 
    } = req.body;

    // Check if student exists
    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Student with this roll number already exists' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create user account
    const user = await User.create({
      email,
      password: password || 'student123',
      role: 'student'
    });

    // Create student
    const student = await Student.create({
      userId: user._id,
      firstName,
      lastName: lastName || '',
      rollNumber,
      class: studentClass,
      section,
      dateOfBirth,
      gender,
      parentName,
      parentPhone,
      admissionDate: new Date()
    });

    // Send email notification
    try {
      await sendEmail({
        email: user.email,
        subject: 'Student Account Created - Ramakrishna Vidya Mandir',
        message: `<h1>Welcome to Ramakrishna Vidya Mandir</h1>
          <p>Dear ${firstName},</p>
          <p>Your student account has been created successfully.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password || 'student123'}</p>
          <p><strong>Roll Number:</strong> ${rollNumber}</p>
          <p><strong>Class:</strong> ${studentClass} - ${section}</p>
          <p>Please login and change your password immediately.</p>
          <p>Best regards,<br>School Administration</p>`
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if roll number is being changed and if it already exists
    if (req.body.rollNumber && req.body.rollNumber !== student.rollNumber) {
      const existingStudent = await Student.findOne({ rollNumber: req.body.rollNumber });
      if (existingStudent) {
        return res.status(400).json({ success: false, message: 'Roll number already exists' });
      }
    }

    // Handle email update if provided
    if (req.body.email && student.userId) {
      const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: student.userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      // Update email in User collection
      await User.findByIdAndUpdate(student.userId, { email: req.body.email });
    }

    // Remove email from student update since it's not a student field
    const studentUpdateData = { ...req.body };
    delete studentUpdateData.email;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      studentUpdateData,
      { new: true, runValidators: true }
    ).populate('userId', 'email');

    res.json({ success: true, message: 'Student updated successfully', data: updatedStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Delete associated user
    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;