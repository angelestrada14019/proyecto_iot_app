import mongoose from 'mongoose';
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const deviceSchema = new Schema({
  userId:{
    type: String,
    required: [true, 'El id del usuario es necesario'],
  },
  dId:{
    type: String,
    required: [true, 'El id del dispositivo es necesario'],
    unique: true
  },
  name:{
    type: String,
    required: [true, 'El nombre del dispositivo es necesario'],
  },
  selected:{
    type: Boolean,
    default: false,
    required: [true, 'El estado del dispositivo es necesario'],
  },
  templateId:{
    type: String,
    required: [true, 'El id del template es necesario'],
  },
  templateName:{
    type: String,
    required: [true, 'El nombre del template es necesario'],
  },
  createTime:{
    type: Number,
  }
});
//validator
deviceSchema.plugin(uniqueValidator, { message: '{PATH} debe de ser único' });


//convert to model
const Device = mongoose.model('Device', deviceSchema);


export default Device;
