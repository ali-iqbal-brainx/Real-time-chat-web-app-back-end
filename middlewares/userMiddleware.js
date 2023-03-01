const jwtService = require("../services/jwtService");
const constants = require("../shared/constants");

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

                    const user = constants.users.find(o => o._id === data._id);
                    console.log("user :", user);

                    if (!user) {
                        return response
                            .status(401)
                            .json({
                                error: 'user not found'
                            });
                    }

                    if (user.jwt === null) {
                        return response
                            .status(401)
                            .json({ error: "Session token not found" });
                    }

                    if (user.jwt !== token) {
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

                    request.user = user;
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

module.exports = {
    verifyAuth
};
