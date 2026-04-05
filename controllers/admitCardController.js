const AdmitCard = require('../models/AdmitCard');
const Student = require('../models/Student');
const { generateAdmitCardPDF } = require('../utils/generateAdmitCard');
const { generateQRCode } = require('../utils/qrCode');
const { uploadToCloudinary } = require('../middleware/upload');

// Generate admit card
const generateAdmitCard = async (req, res, next) => {
  try {
    const { studentId, examName, examDate, examTime, venue, seatNo } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if admit card already exists
    const existingAdmitCard = await AdmitCard.findOne({
      studentId,
      examName,
    });

    if (existingAdmitCard) {
      return res.status(400).json({ message: 'Admit card already generated for this exam' });
    }

    // Generate QR Code
    const qrData = {
      studentId: student._id,
      rollNo: student.rollNo,
      examName,
      seatNo,
    };

    const qrCode = await generateQRCode(qrData);

    // Generate PDF
    const pdfBuffer = await generateAdmitCardPDF(student, {
      examName,
      examDate,
      examTime,
      venue,
      seatNo,
    });

    // Upload PDF to Cloudinary
    try {
      const result = await uploadToCloudinary(pdfBuffer, 'school-management/admit-cards', 'raw');

      const newAdmitCard = new AdmitCard({
        studentId,
        examName,
        examDate,
        examTime,
        venue,
        seatNo,
        qrCode,
        pdfUrl: result.secure_url,
      });

      await newAdmitCard.save();

      res.status(201).json({
        message: 'Admit card generated successfully',
        admitCard: newAdmitCard,
      });
    } catch (uploadError) {
      console.error('PDF upload error:', uploadError);
      res.status(500).json({ message: 'Failed to upload admit card PDF' });
    }
  } catch (error) {
    next(error);
  }
};

// Get all admit cards
const getAllAdmitCards = async (req, res, next) => {
  try {
    const admitCards = await AdmitCard.find().populate('studentId', 'firstName lastName rollNo');
    res.json(admitCards);
  } catch (error) {
    next(error);
  }
};

// Get admit card by student
const getAdmitCardByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const admitCards = await AdmitCard.find({ studentId }).populate('studentId');
    res.json(admitCards);
  } catch (error) {
    next(error);
  }
};

// Download admit card PDF
const downloadAdmitCard = async (req, res, next) => {
  try {
    const { admitCardId } = req.params;
    const admitCard = await AdmitCard.findById(admitCardId);

    if (!admitCard) {
      return res.status(404).json({ message: 'Admit card not found' });
    }

    res.json({ pdfUrl: admitCard.pdfUrl });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateAdmitCard,
  getAllAdmitCards,
  getAdmitCardByStudent,
  downloadAdmitCard,
};
