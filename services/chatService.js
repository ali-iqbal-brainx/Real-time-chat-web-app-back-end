const one_to_one = require("../models/one_to_one");
const private = require("../models/private");
const public = require("../models/public");


const createOneToOneChat = async (data) => {

    console.log("In add one to one chat query");
    return new Promise((resolve, reject) => {
        new one_to_one(data)
            .save()
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    });

}

const findOneToOneChat = async (condition) => {

    console.log("In find one to one chat query");
    return new Promise((resolve, reject) => {
        one_to_one.findOne(condition)
            .then((chat) => resolve(chat))
            .catch((err) => reject(err));
    });

}

const updateOneToOneChat = async (condition, update, option) => {

    console.log("In update one to one chat query");
    return new Promise((resolve, reject) => {
        one_to_one.findOneAndUpdate(condition, update, option)
            .then((chat) => resolve(chat))
            .catch((err) => reject(err));
    });

}

const deleteOneToOneChat = async (condition) => {

    console.log("In delete one to one chat query");
    return new Promise((resolve, reject) => {
        one_to_one.deleteOne(condition)
            .then((chat) => resolve(chat.deletedCount))
            .catch((err) => reject(err));
    });

}

const insertOneToOneMany = async (data) => {

    console.log("In insert many of one to one query");
    return new Promise((resolve, reject) => {
        one_to_one.insertMany(data)
            .then((res) => resolve(res))
            .catch((err) => reject(err));
    });

}

const createPrivateChat = async (data) => {

    console.log("In add private chat query");
    return new Promise((resolve, reject) => {
        new private(data)
            .save()
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    });

}

const findPrivateGroup = async (condition) => {

    console.log("In find private chat query");
    return new Promise((resolve, reject) => {
        private.findOne(condition)
            .then((chat) => resolve(chat))
            .catch((err) => reject(err));
    });

}

const updatePrivateChat = async (condition, update, option) => {

    console.log("In update private chat query");
    return new Promise((resolve, reject) => {
        private.findOneAndUpdate(condition, update, option)
            .then((chat) => resolve(chat))
            .catch((err) => reject(err));
    });

}

const deletePrivateChat = async (condition) => {

    console.log("In delete private chat query");
    return new Promise((resolve, reject) => {
        private.deleteOne(condition)
            .then((chat) => resolve(chat.deletedCount))
            .catch((err) => reject(err));
    });

}

const findPublicChat = async (condition) => {

    console.log("In find public chat query");
    return new Promise((resolve, reject) => {
        public.findOne(condition)
            .then((chat) => resolve(chat))
            .catch((err) => reject(err));
    });

}

const updatePublicChat = async (condition, update, option) => {

    console.log("In update public chat query");
    return new Promise((resolve, reject) => {
        public.findOneAndUpdate(condition, update, option)
            .then((chat) => resolve(chat))
            .catch((err) => reject(err));
    });

}

const publicChatAggregate = async (query) => {

    console.log("In public chat aggregate query");
    return new Promise((resolve, reject) => {
        public.aggregate(query)
            .then((result) => resolve(result))
            .catch((err) => reject(err));
    });

}

const privateChatAggregate = async (query) => {

    console.log("In private chat aggregate query");
    return new Promise((resolve, reject) => {
        private.aggregate(query)
            .then((result) => resolve(result))
            .catch((err) => reject(err));
    });

}

const oneToOneChatAggregate = async (query) => {

    console.log("In one to one chat aggregate query");
    return new Promise((resolve, reject) => {
        one_to_one.aggregate(query)
            .then((result) => resolve(result))
            .catch((err) => reject(err));
    });

}

module.exports = {
    createOneToOneChat,
    updateOneToOneChat,
    findOneToOneChat,
    deleteOneToOneChat,
    insertOneToOneMany,
    createPrivateChat,
    findPrivateGroup,
    updatePrivateChat,
    updatePublicChat,
    findPublicChat,
    deletePrivateChat,
    publicChatAggregate,
    privateChatAggregate,
    oneToOneChatAggregate
}