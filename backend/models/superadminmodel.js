// models/superadmin.model.js
const mongoose = require("mongoose");

const superAdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  contactEmail: { type: String, required: true },
  companyId: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = {
  SuperAdmin: mongoose.model("SuperAdmin", superAdminSchema),
  Company: mongoose.model("Company", companySchema),
};
