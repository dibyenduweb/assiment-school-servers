const express = require('express');
const StudyMaterial = require('../models/StudyMaterial');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// @route   GET /api/materials
// @desc    Get all materials
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { class: studentClass, subject } = req.query;
    let query = { isPublic: true };

    if (studentClass) query.class = studentClass;
    if (subject) query.subject = subject;

    const materials = await StudyMaterial.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/materials
// @desc    Upload material
// @access  Private (Teacher/Admin)
router.post('/', protect, authorize('teacher', 'admin', 'super_admin'), upload.single('file'), async (req, res) => {
  try {
    const material = await StudyMaterial.create({
      ...req.body,
      fileUrl: req.file.path,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/materials/:id
// @desc    Update material
// @access  Private (Teacher/Admin)
router.put('/:id', protect, authorize('teacher', 'admin', 'super_admin'), upload.single('file'), async (req, res) => {
  try {
    const updates = req.body;
    
    if (req.file) {
      updates.fileUrl = req.file.path;
      updates.fileSize = req.file.size;
    }

    const material = await StudyMaterial.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.json({ success: true, message: 'Material updated successfully', data: material });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/materials/:id
// @desc    Delete material
// @access  Private (Teacher/Admin)
router.delete('/:id', protect, authorize('teacher', 'admin', 'super_admin'), async (req, res) => {
  try {
    const material = await StudyMaterial.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;