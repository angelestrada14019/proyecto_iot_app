import mongoose from 'mongoose';
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre es necesario'],
    },
    email: {
        type: String,
        required: [true, 'El email es necesario'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es necesaria'],
    }
});
//validator
userSchema.plugin(uniqueValidator, { message: '{PATH} debe de ser único' });

//convert to model
const User = mongoose.model('User', userSchema);

export default User;
