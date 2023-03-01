const constants = require("../shared/constants");
const bcrypt = require('bcryptjs');

const profileSetup = async (request, response) => {
    try {
        const user = request.user;
        const { name, password } = request.body;

        console.log("user :", user);
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

        //update user object in array
        objIndex = constants.users.findIndex((obj => obj._id === user._id));
        constants.users[objIndex].name = name;
        constants.users[objIndex].password = hashedPassword;

        console.log("updated user :", constants.users[objIndex]);

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
        const user = request.user;
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

module.exports = {
    profileSetup,
    getUserData
}