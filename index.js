require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ limit: process.env.EXPRESS_LIMIT, extended: true }));
const db = require('./configs/mongoDb');
const port = process.env.PORT || 4000;

app.use(express.json({ limit: process.env.EXPRESS_LIMIT }));
const corsOrigin = {
    origin: 'http://localhost:3000', //or whatever port your frontend is using
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOrigin));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.use('/api/v1', require("./routes/v1/index.js"));

db.connection()
    .then(() => {
        console.log("DB connection successfully")
        server.listen(port, () => {
            console.log(`server listening on port ${port}`);
        });
    })
    .catch((err) => {
        console.log(err)
    })


io.on("connection", (socket) => {
    console.log("socket id :", socket.id);

    socket.on("join_room", (data) => {
        socket.join(data);
        console.log(`user with id : ${socket.id} joined room : ${data}`);
    });

    socket.on("send_message", (data) => {
        console.log("socket data :", data);
        socket.to(data[1]).emit("recieve_message", data);
    });

    socket.on("send_private_message", (data) => {
        console.log("socket data :", data);
        socket.to(data[1]).emit("recieve_private_message", data);
    });

    socket.on("send_one_to_one_message", (data) => {
        console.log("one_to_one_message :", data);
        socket.to(data[1]).emit("recieve_one_to_one_message", data);
    });

    socket.on("msg_counter", (data) => {
        console.log("all chats msg :", data);
        socket.to("ALLCHATSGROUP").emit("recieve_msg_all_chats", data);
    });

    socket.on("add_new_user", (data) => {
        console.log("new user data :", data);
        socket.to("NEW_USER").emit("append_new_user", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected :", socket.id);
    });
});
