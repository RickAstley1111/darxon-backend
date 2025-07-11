const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: String,
  role: String,
  parentId: String,
  status: { type: String, default: "пришёл" },
  tasks: [
    {
      text: String,
      completed: Boolean
    }
  ]
});

module.exports = mongoose.model('Employee', employeeSchema);