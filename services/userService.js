const user = require("../models/user");


const addUser = async (data) => {

    console.log("In add user query");
    return new Promise((resolve, reject) => {
        new user(data)
            .save()
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    });

}

const findUser = async (condition) => {

    console.log("In find user");
    return new Promise((resolve, reject) => {
        user.findOne(condition)
            .then((user) => resolve(user))
            .catch((err) => reject(err));
    });

}

const updateUser = async (condition, update, option) => {

    console.log("In update User query");
    return new Promise((resolve, reject) => {
        user.findOneAndUpdate(condition, update, option)
            .then((user) => resolve(user))
            .catch((err) => reject(err));
    });

}

const userAggregate = async (query) => {

    console.log("In users aggregate query");
    return new Promise((resolve, reject) => {
        user.aggregate(query)
            .then((result) => resolve(result))
            .catch((err) => reject(err));
    });

}

const deleteUser = async (condition) => {

    console.log("In delete user query");
    return new Promise((resolve, reject) => {
        user.deleteOne(condition)
            .then((member) => resolve(member.deletedCount))
            .catch((err) => reject(err));
    });

}

module.exports = {
    findUser,
    addUser,
    updateUser,
    userAggregate,
    deleteUser
}