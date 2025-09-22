const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    contactEmail: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    companyId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    address: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Company || mongoose.model('Company', companySchema);
