const constants = require("../shared/constants");
const messageService = require("../services/messageService");
const { default: mongoose } = require("mongoose");

const generateChatCode = () => {

    return Math.floor(constants.shared.chatCodeR1 + Math.random() * constants.shared.chatCodeR2).toString();

}

const seenAllMessages = async (id, user) => {

    return await messageService.updateMessages(
        {
            $and: [
                {
                    $or: [
                        { chatId: id }
                    ]
                },
                {
                    seenBy: { $not: { $elemMatch: { $eq: user._id } } }
                }
            ]
        },
        {
            $push: { seenBy: user._id }
        }
    );

}

const postMessage = async (chat, chatType, user, message) => {

    let msg = {
        chatId: new mongoose.Types.ObjectId(chat._id),
        chatType: chatType,
        userId: user._id,
        seenBy: [user._id],
        message: message,
    };

    const messageObj = await messageService.addMessage(msg);
    console.log("message added:", messageObj);

    delete msg.userId;
    delete msg.chatId;
    delete msg.chatType;
    msg['userDetails'] = { _id: user._id, name: user.name };
    msg['createdAt'] = messageObj.createdAt;
    msg['updatedAt'] = messageObj.updatedAt;
    msg['_id'] = messageObj._id;

    return msg;

}

module.exports = {
    generateChatCode,
    seenAllMessages,
    postMessage
}