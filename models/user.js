const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { 
        type: String, 
        unique: true, 
        required: [true, 'Username is needed'] 
    },
    email: { 
        type: String, 
        unique: true, 
        required: [true, 'Email is needed!']
     },
    password: { 
        type: String,
        // select: false, 
        required: [true, 'Password is needed'],
        min: [8, "Your password must be atleast 8 characters long!"],
        max: 25
    }
});


const User = mongoose.model('User', userSchema);

module.exports = User;