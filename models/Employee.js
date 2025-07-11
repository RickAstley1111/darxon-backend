const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
    name: String,
    role: String,
    status: { type: String, default: "пришел" },
    parentId: String,
    tasks: [{ text: String }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // связь с владельцем
})

module.exports = mongoose.model("Employee", employeeSchema)