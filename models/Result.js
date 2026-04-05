const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    enum: ['unit_test', 'half_yearly', 'annual', 'quarterly'],
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  subjects: [{
    subjectName: String,
    subjectCode: String,
    theoryMarks: Number,
    practicalMarks: Number,
    internalMarks: Number,
    totalMarks: Number,
    maxMarks: Number,
    grade: String,
    gradePoint: Number
  }],
  totalObtained: Number,
  totalMaximum: Number,
  percentage: Number,
  overallGrade: String,
  rank: Number,
  resultStatus: {
    type: String,
    enum: ['pass', 'fail', 'compartment']
  },
  examDate: Date,
  resultDate: Date,
  published: {
    type: Boolean,
    default: false
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Result', resultSchema);