const express = require('express');
const Notice = require('../models/Notice');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// @route   GET /api/notices
// @desc    Get all notices
// @access  Public
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true }).sort({ publishedAt: -1 });
    res.json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/notices
// @desc    Create notice
// @access  Private (Admin)
router.post('/', protect, authorize('admin', 'super_admin'), upload.array('attachments', 5), async (req, res) => {
  try {
    const attachments = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: file.path,
      fileType: file.mimetype
    }));

    const notice = await Notice.create({
      ...req.body,
      attachments,
      publishedBy: req.user._id
    });

    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/notices/:id
// @desc    Update notice
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin', 'super_admin'), upload.array('attachments', 5), async (req, res) => {
  try {
    const updates = req.body;
    
    if (req.files && req.files.length > 0) {
      const attachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype
      }));
      updates.attachments = attachments;
    }

    const notice = await Notice.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.json({ success: true, message: 'Notice updated successfully', data: notice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/notices/:id
// @desc    Delete notice
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    await Notice.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;