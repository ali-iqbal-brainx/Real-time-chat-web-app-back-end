const userService = require("../services/userService");
const bcrypt = require('bcryptjs');
const { default: mongoose } = require("mongoose");

const profileSetup = async (request, response) => {
    try {
        const user = request.user;
        const { name, password } = request.body;

        console.log("name :", name);
        console.log("password :", password);

        if (!name || !password) {
            return response
                .status(406)
                .json({
                    error: "Required fields are missing"
                });
        }

        //hashed the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("hased password :", hashedPassword);

        //update user 
        const updatedUser = await userService.updateUser(
            {
                name: user.name
            },
            {
                $set: { name, password: hashedPassword }
            },
            {
                new: true
            }
        )
        console.log("updated user :", updatedUser);

        return response
            .status(200)
            .json({
                message: "profile updated successfully"
            });

    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const getUserData = async (request, response) => {
    try {
        let user = request.user;
        const userId = request.params.id;

        console.log("user :", user);
        console.log("user id :", userId);

        if (userId) {
            user = await userService.findUser(
                {
                    _id: mongoose.Types.ObjectId(userId)
                }
            );
        }
        console.log("user :", user);

        return response
            .status(200)
            .json({
                data: {
                    _id: user._id,
                    name: user.name
                }
            });


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const getUsers = async (request, response) => {
    try {
        const user = request.user;

        console.log("In get users controller");

        const users = await userService.userAggregate([
            {
                $match: {
                    _id: { $ne: user._id }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1
                }
            }
        ]);

        return response
            .status(200)
            .json({
                users
            });


    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

module.exports = {
    profileSetup,
    getUserData,
    getUsers
}