const express = require('express');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Generate complaint ID
const generateComplaintId = () => {
  return 'CMP' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// @route   GET /api/complaints
// @desc    Get all complaints
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      query.$or = [{ respondedBy: req.user._id }, { status: 'pending' }];
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/complaints
// @desc    Submit complaint
// @access  Public
router.post('/', async (req, res) => {
  try {
    const complaint = await Complaint.create({
      complaintId: generateComplaintId(),
      ...req.body
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Respond to complaint
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        response: req.body.response,
        status: req.body.status,
        respondedBy: req.user._id,
        respondedAt: Date.now()
      },
      { new: true }
    );

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/complaints/:id
// @desc    Delete complaint
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;