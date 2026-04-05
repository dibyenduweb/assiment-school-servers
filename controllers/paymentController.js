const Payment = require('../models/Payment');
const Student = require('../models/Student');

// Get all payments
const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('studentId', 'firstName lastName rollNo')
      .populate('verifiedBy', 'name');
    res.json(payments);
  } catch (error) {
    next(error);
  }
};

// Student submits payment
const submitPayment = async (req, res, next) => {
  try {
    const { studentId, amount, utrNumber } = req.body;

    const existingPayment = await Payment.findOne({ utrNumber });
    if (existingPayment) {
      return res.status(400).json({ message: 'UTR number already used' });
    }

    const newPayment = new Payment({
      studentId,
      amount,
      utrNumber,
      status: 'pending',
    });

    await newPayment.save();

    res.status(201).json({
      message: 'Payment submitted successfully. Awaiting verification.',
      payment: newPayment,
    });
  } catch (error) {
    next(error);
  }
};

// Admin verifies payment
const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { status, remarks } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status,
        remarks,
        verifiedBy: req.user.id,
        verifiedDate: new Date(),
      },
      { new: true }
    );

    res.json({
      message: 'Payment verification updated',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// Get payment by student
const getPaymentByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const payments = await Payment.find({ studentId });
    res.json(payments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPayments,
  submitPayment,
  verifyPayment,
  getPaymentByStudent,
};
