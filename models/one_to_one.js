const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const oneToOneSchema = new Schema({
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
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

const one_to_one = mongoose.model("one_to_one", oneToOneSchema);
module.exports = one_to_one;