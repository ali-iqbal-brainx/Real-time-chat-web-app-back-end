const jwtService = require("../services/jwtService");
const userService = require("../services/userService");
const chatService = require("../services/chatService");
const bcrypt = require('bcryptjs');

const login = async (request, response) => {
    try {
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

        const user = await userService.findUser(
            {
                name
            }
        );
        console.log("user :", user);

        if (!user) {
            return response
                .status(400)
                .json({
                    error: 'invalid user name'
                });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return response
                .status(400)
                .json({
                    error: "invalid Password"
                });
        }

        const token = jwtService.generateAccessToken(user);
        await userService.updateUser(
            {
                name
            },
            {
                $set: { jwt: token }
            },
            {
                new: true
            }
        );


        return response
            .set("access-control-expose-headers", "access_token")
            .header("access_token", token)
            .status(200)
            .json({
                user: {
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

const signup = async (request, response) => {
    try {
        const { name, password } = request.body;

        console.log("in sign up controller");

        //hashed the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("hased password :", hashedPassword);

        //store user in db 
        const user = await userService.addUser(
            {
                name,
                password: hashedPassword
            }
        );

        console.log("user added :", user);

        //create one to one chat of this user with all other users
        const allUsers = await userService.userAggregate([
            {
                $match: {
                    _id: { $ne: user._id }
                }
            },
            {
                $project: {
                    _id: 1
                }
            }
        ]);
        console.log("All users Ids : ", allUsers);


        if (allUsers?.length) {
            let chats = [];

            for (let i = 0; i < allUsers.length; i++) {
                chats.push({
                    "ids": [user._id, allUsers[i]._id]
                });
            }

            console.log(await chatService.insertOneToOneMany(chats));
        }

        return response
            .status(200)
            .json({
                message: "Success in sign up"
            });
    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }
}

const signout = async (request, response) => {
    try {
        const user = request.user;
        console.log("In sign out controller");

        await userService.updateUser(
            {
                name: user.name
            },
            {
                $set: {
                    "jwt": null
                },
                $push: {
                    "expiredTokens": user.jwt
                }
            }
        );

        return response
            .status(200)
            .json({
                message: "Log out Successfully"
            });
    } catch (error) {
        console.log(error);
        return response
            .status(500)
            .json({
                error: "Something went wrong",
            });
    }

}

module.exports = {
    login,
    signup,
    signout
}