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
        ref: "users",
        required: true,
    },
    ids: [],
    messages: [
        {
            _id: {
                type: ObjectId,
                require: true,
                default: new ObjectId()
            },
            userId: {
                type: ObjectId,
                ref: "users",
                require: true
            },
            seenBy: [],
            message: {
                type: String,
                required: true,
            }
        }
    ],
});

const private = mongoose.model("private", privateSchema);
module.exports = private;