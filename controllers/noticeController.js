const Notice = require('../models/Notice');
const { uploadToCloudinary } = require('../middleware/upload');

// Get all notices
const getAllNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find({ isPublished: true })
      .populate('postedBy', 'name')
      .sort({ postedDate: -1 });
    res.json(notices);
  } catch (error) {
    next(error);
  }
};

// Add notice (admin only)
const addNotice = async (req, res, next) => {
  try {
    const { title, description, content } = req.body;
    let fileUrl = null;

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'school-management/notices', 'auto');
        fileUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const newNotice = new Notice({
      title,
      description,
      content,
      fileUrl,
      postedBy: req.user.id,
    });

    await newNotice.save();

    res.status(201).json({
      message: 'Notice added successfully',
      notice: newNotice,
    });
  } catch (error) {
    next(error);
  }
};

// Update notice
const updateNotice = async (req, res, next) => {
  try {
    const { noticeId } = req.params;
    const updates = req.body;

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'school-management/notices', 'auto');
        updates.fileUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const notice = await Notice.findByIdAndUpdate(noticeId, updates, { new: true });
    res.json({ message: 'Notice updated successfully', notice });
  } catch (error) {
    next(error);
  }
};

// Delete notice
const deleteNotice = async (req, res, next) => {
  try {
    const { noticeId } = req.params;
    await Notice.findByIdAndDelete(noticeId);
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNotices,
  addNotice,
  updateNotice,
  deleteNotice,
};
