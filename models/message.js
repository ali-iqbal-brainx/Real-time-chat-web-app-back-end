const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const constants = require("../shared/constants");

const messageSchema = new Schema({
    chatId: {
        type: ObjectId,
        ref: "chatType",
        require: true
    },
    chatType: {
        type: String,
        enum: constants.shared.chatTypeEnum,
        description: "can only be ONE_TO_ONE, PRIVATE or PUBLIC",
        require: true
    },
    userId: {
        type: ObjectId,
        ref: "user",
        require: true
    },
    seenBy: [],
    message: {
        type: String,
        required: true,
    }
},
    {
        timestamps: true
    });

const message = mongoose.model("message", messageSchema);
module.exports = message;