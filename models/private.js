const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const privateSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    chatCode: {
        type: String,
        required: true
    },
    adminId: {
        type: ObjectId,
        ref: "user",
        required: true,
    },
    ids: []
});

const private = mongoose.model("private", privateSchema);
module.exports = private;