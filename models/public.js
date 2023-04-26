const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const constants = require("../shared/constants");

const publicSchema = new Schema({
    name: {
        type: String,
        enum: constants.shared.publicChatName
    },
    messages: [
        {
            _id: {
                type: ObjectId,
                require: true,
            },
            userId: {
                type: ObjectId,
                ref: "users",
                require: true
            },
            seenBy: [ObjectId],
            message: {
                type: String,
                required: true,
            }
        }
    ],
    chatCode: {
        type: String,
        enum: constants.shared.publicChatCode
    },
});

const public = mongoose.model("public", publicSchema);
module.exports = public;