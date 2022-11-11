const mongoose = require('mongoose');
const UserDataSchema = new mongoose.Schema({
    UserId: {
        type: String,
        require: true,
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        require: true
    },
    isAdmin: {
        type: String,
        require: true
    }
});
module.exports = mongoose.model('User', UserDataSchema);