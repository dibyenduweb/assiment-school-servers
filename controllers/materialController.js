const Material = require('../models/Material');
const { uploadToCloudinary } = require('../middleware/upload');

// Get all materials
const getAllMaterials = async (req, res, next) => {
  try {
    const materials = await Material.find()
      .populate('uploadedBy', 'name')
      .sort({ uploadDate: -1 });
    res.json(materials);
  } catch (error) {
    next(error);
  }
};

// Get materials by class
const getMaterialsByClass = async (req, res, next) => {
  try {
    const { className } = req.params;
    const materials = await Material.find({ class: className }).populate('uploadedBy', 'name');
    res.json(materials);
  } catch (error) {
    next(error);
  }
};

// Upload material
const uploadMaterial = async (req, res, next) => {
  try {
    const { title, description, subject, class: className } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'File required' });
    }

    let fileUrl = null;
    try {
      const result = await uploadToCloudinary(req.file.buffer, 'school-management/materials', 'auto');
      fileUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ message: 'File upload failed' });
    }

    const newMaterial = new Material({
      title,
      description,
      subject,
      class: className,
      fileUrl,
      uploadedBy: req.user.id,
    });

    await newMaterial.save();

    res.status(201).json({
      message: 'Material uploaded successfully',
      material: newMaterial,
    });
  } catch (error) {
    next(error);
  }
};

// Delete material
const deleteMaterial = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    await Material.findByIdAndDelete(materialId);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMaterials,
  getMaterialsByClass,
  uploadMaterial,
  deleteMaterial,
};
