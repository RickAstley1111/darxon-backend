const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  status: { type: String, enum: ['пришёл', 'ушёл'], default: 'пришёл' },
  tasks: [{ text: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Employee', employeeSchema);
    