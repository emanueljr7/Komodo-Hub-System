import mongoose from "mongoose";

const animalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    species: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['endangered', 'vulnerable', 'least concern'],
        default: 'least concern'
    }
}, { timestamps: true });

const Animal = mongoose.model('Animal', animalSchema);

export default Animal;  