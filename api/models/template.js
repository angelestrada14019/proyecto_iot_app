import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const templateSchema = new Schema({
    userId: { type: String, required: [true,] },
    name: { type: String, required: [true] },
    description: {type: String},
    createTime: { type: Number, required: [true] },
    widgets: {type: Array, default: []}
});


// Schema to model.
const Template = mongoose.model('Template', templateSchema);

export default Template;
