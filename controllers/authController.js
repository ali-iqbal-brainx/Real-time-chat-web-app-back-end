const constants = require("../shared/constants");
const uuid = require('uuid');
const jwtService = require("../services/jwtService");
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

        let user = constants.users.find(o => o.name === name);
        console.log("user :", user);

        if (!user) {
            return response
                .status(401)
                .json({
                    error: 'invalid name'
                });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return response
                .status(401)
                .json({
                    error: "invalid Password"
                });
        }

        const token = jwtService.generateAccessToken(user);

        objIndex = constants.users.findIndex((obj => obj._id === user._id));
        constants.users[objIndex].jwt = token;


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
        
        //store in array
        constants.users.push({ _id: uuid.v4(), name: name, password: hashedPassword, jwt: null });

        console.log("User array :", constants.users);

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

module.exports = {
    login,
    signup
}