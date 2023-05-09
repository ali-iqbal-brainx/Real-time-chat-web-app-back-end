const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const constants = require("../shared/constants");

const publicSchema = new Schema({
    name: {
        type: String,
        enum: constants.shared.publicChatName
    },
    chatCode: {
        type: String,
        enum: constants.shared.publicChatCode
    },
});

const public = mongoose.model("public", publicSchema);
module.exports = public;