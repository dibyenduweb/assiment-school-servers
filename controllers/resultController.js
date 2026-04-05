const Result = require('../models/Result');

// Calculate grade based on percentage
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
};

// Add result
const addResult = async (req, res, next) => {
  try {
    const { studentId, examName, class: className, marks, totalMarks } = req.body;

    const percentage = (marks / totalMarks) * 100;
    const grade = calculateGrade(percentage);

    const newResult = new Result({
      studentId,
      examName,
      class: className,
      marks,
      totalMarks,
      percentage: Math.round(percentage),
      grade,
    });

    await newResult.save();

    res.status(201).json({
      message: 'Result added successfully',
      result: newResult,
    });
  } catch (error) {
    next(error);
  }
};

// Get results by student
const getResultByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const results = await Result.find({ studentId });
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Get all results
const getAllResults = async (req, res, next) => {
  try {
    const results = await Result.find().populate('studentId', 'firstName lastName rollNo');
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Update result
const updateResult = async (req, res, next) => {
  try {
    const { resultId } = req.params;
    const { marks, totalMarks } = req.body;

    const percentage = (marks / totalMarks) * 100;
    const grade = calculateGrade(percentage);

    const result = await Result.findByIdAndUpdate(
      resultId,
      { marks, totalMarks, percentage: Math.round(percentage), grade },
      { new: true }
    );

    res.json({ message: 'Result updated successfully', result });
  } catch (error) {
    next(error);
  }
};

// Delete result
const deleteResult = async (req, res, next) => {
  try {
    const { resultId } = req.params;
    await Result.findByIdAndDelete(resultId);
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addResult,
  getResultByStudent,
  getAllResults,
  updateResult,
  deleteResult,
};
