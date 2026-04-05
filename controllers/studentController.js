const Student = require('../models/Student');
const User = require('../models/User');
const { uploadToCloudinary } = require('../middleware/upload');

// Add student manually
const addStudent = async (req, res, next) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    const { firstName, lastName, rollNo, class: className, section, dateOfBirth, parentName, parentPhone, email } = req.body;

    const existingUser = await User.findOne({ email });
    let user;

    if (!existingUser) {
      user = new User({
        name: `${firstName} ${lastName}`,
        email,
        password: 'DefaultPass123!',
        role: 'student',
      });
      await user.save();
    } else {
      user = existingUser;
    }

    let studentImage = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'school-management/students', 'image');
        studentImage = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const newStudent = new Student({
      userId: user._id,
      firstName,
      lastName,
      rollNo,
      class: className,
      section,
      dateOfBirth,
      parentName,
      parentPhone,
      studentImage,
    });

    console.log('Saving student:', newStudent);
    await newStudent.save();

    res.status(201).json({
      message: 'Student added successfully',
      student: newStudent,
    });
  } catch (error) {
    next(error);
  }
};

// Get all students
const getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().populate('userId', 'name email');
    res.json(students);
  } catch (error) {
    next(error);
  }
};

// Get single student
const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    next(error);
  }
};

// Update student
const updateStudent = async (req, res, next) => {
  try {
    const updates = req.body;
    
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'school-management/students', 'image');
        updates.studentImage = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    next(error);
  }
};

// Delete student
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await User.findByIdAndDelete(student.userId);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Upload students via CSV
const uploadStudentsCSV = async (req, res, next) => {
  try {
    const csv = require('csv-parser');
    const { Readable } = require('stream');

    if (!req.file) {
      return res.status(400).json({ message: 'CSV file required' });
    }

    const results = [];
    Readable.from([req.file.buffer])
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const createdStudents = [];

          for (const row of results) {
            const { firstName, lastName, rollNo, class: className, section, dateOfBirth, parentName, parentPhone, email } = row;

            const existingUser = await User.findOne({ email });
            let user;

            if (!existingUser) {
              user = new User({
                name: `${firstName} ${lastName}`,
                email,
                password: 'DefaultPass123!',
                role: 'student',
              });
              await user.save();
            } else {
              user = existingUser;
            }

            const newStudent = new Student({
              userId: user._id,
              firstName,
              lastName,
              rollNo,
              class: className,
              section,
              dateOfBirth: new Date(dateOfBirth),
              parentName,
              parentPhone,
            });

            await newStudent.save();
            createdStudents.push(newStudent);
          }

          res.json({
            message: `${createdStudents.length} students uploaded successfully`,
            students: createdStudents,
          });
        } catch (error) {
          next(error);
        }
      });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  uploadStudentsCSV,
};
