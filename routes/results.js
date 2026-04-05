const express = require('express');
const Result = require('../models/Result');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/results
// @desc    Get all results
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

    const results = await Result.find(query).populate('studentId', 'firstName lastName rollNumber class section');
    res.json({ success: true, count: results.length,  results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/results
// @desc    Create result
// @access  Private (Admin/Teacher)
router.post('/', protect, authorize('admin', 'teacher', 'super_admin'), async (req, res) => {
  try {
    const result = await Result.create({
      ...req.body,
      publishedBy: req.user._id
    });

    res.status(201).json({ success: true,  result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/results/:id
// @desc    Update result
// @access  Private (Admin/Teacher)
router.put('/:id', protect, authorize('admin', 'teacher', 'super_admin'), async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    res.json({ success: true, message: 'Result updated successfully', result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/results/:id
// @desc    Delete result
// @access  Private (Admin/Teacher)
router.delete('/:id', protect, authorize('admin', 'teacher', 'super_admin'), async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/results/public
// @desc    Get result by roll number and DOB (Public)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { rollNumber, dateOfBirth } = req.query;

    if (!rollNumber || !dateOfBirth) {
      return res.status(400).json({ message: 'Roll number and date of birth are required' });
    }

    const student = await Student.findOne({ 
      rollNumber,
      dateOfBirth: new Date(dateOfBirth)
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const results = await Result.find({ studentId: student._id }).populate('studentId');
    res.json({ success: true,  results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;