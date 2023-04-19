const jwtService = require("../services/jwtService");
const userService = require("../services/userService");

const verifyAuth = async (request, response, next) => {
    try {
        const authHeader = request.headers.access_token;

        if (authHeader) {
            const token = authHeader.split(" ")[1];

            console.log("token :", token);
            console.log("Key :", process.env.JWT_TOKEN_KEY);
            jwtService.verifyToken(
                token,
                process.env.JWT_TOKEN_KEY,
                async (err, data) => {
                    console.log("Error :", err);
                    console.log("data: ", data);
                    if (err) {
                        return response
                            .status(401)
                            .json({ error: "Token is not valid!" });
                    }

                    const dbUser = await userService.findUser(
                        {
                            _id: data._id
                        }
                    );
                    console.log("user :", dbUser);
                    console.log("db user expired token array :", dbUser.expiredTokens);

                    if (!dbUser) {
                        return response
                            .status(401)
                            .json({
                                error: 'user not found'
                            });
                    }

                    if (dbUser?.expiredTokens?.includes(token)) {
                        return response
                            .status(401)
                            .json({ error: "Token has been expired" });
                    }

                    if (dbUser.jwt === null) {
                        return response
                            .status(401)
                            .json({ error: "Session token not found" });
                    }

                    if (dbUser.jwt !== token) {
                        return response
                            .status(401)
                            .json({ error: "Token does not match with databse token" });
                    }

                    const decoded = jwtService.decodeToken(token);
                    if (!decoded) {
                        return response
                            .status(401)
                            .json({ error: "Invalid token" });
                    }

                    request.user = dbUser;
                    next();
                }
            );
        } else {
            response
                .status(403)
                .json({
                    error: "'access_token' required in headers"
                });
        }
    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }

};

const signUpAuth = async (request, response, next) => {
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

        if (password.length<8) {
            return response
                .status(406)
                .json({
                    error: "password should be min 8 characters long"
                });
        }

        const user = await userService.findUser(
            {
                name
            }
        );

        if (user?.name) {
            return response
                .status(400)
                .json({
                    error: "user already exist with this name!"
                });
        }

        next();
    } catch (error) {
        console.log(error);
        response.status(500).json({
            error: "Something went wrong",
        });
    }

};

module.exports = {
    verifyAuth,
    signUpAuth
};
