const message = require("../models/message");


const addMessage = async (data) => {

    console.log("In add message query");
    return new Promise((resolve, reject) => {
        new message(data)
            .save()
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    });

}

const findMessages = async (condition) => {

    console.log("In find messages");
    return new Promise((resolve, reject) => {
        message.find(condition)
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    });

}

const messageAggregate = async (query) => {

    console.log("In message aggregate query");
    return new Promise((resolve, reject) => {
        message.aggregate(query)
            .then((result) => resolve(result))
            .catch((err) => reject(err));
    });

}

const deleteMessages = async (condition) => {

    console.log("In delete messages query");
    return new Promise((resolve, reject) => {
        message.deleteMany(condition)
            .then((member) => resolve(member.deletedCount))
            .catch((err) => reject(err));
    });

}

const updateMessages = async (condition, update, option) => {

    console.log("In update messages query");
    return new Promise((resolve, reject) => {
        message.updateMany(condition, update, option)
            .then((result) => resolve(result.modifiedCount))
            .catch((err) => reject(err));
    });

}

module.exports = {
    addMessage,
    findMessages,
    messageAggregate,
    deleteMessages,
    updateMessages
}