import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnLine = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        console.log("New socket connected:", socket.id);

        // =========================
        // JOIN CALL
        // =========================

        socket.on("join-call", (path) => {

            if (connections[path] === undefined) {
                connections[path] = [];
            }

            const existingUsers = [...connections[path]];

            connections[path].push(socket.id);

            timeOnLine[socket.id] = new Date();

            console.log(
                "JOIN:",
                socket.id,
                "ROOM USERS:",
                connections[path]
            );

            // ==========================================
            // Tell existing users about the new user
            // ==========================================

            existingUsers.forEach((userId) => {

                io.to(userId).emit(
                    "user-joined",
                    socket.id,
                    [socket.id]
                );

            });

            // ==========================================
            // Tell the new user about existing users
            // ==========================================

            io.to(socket.id).emit(
                "user-joined",
                socket.id,
                existingUsers
            );

            // ==========================================
            // Send previous chat messages
            // ==========================================

            if (messages[path] !== undefined) {

                messages[path].forEach((message) => {

                    io.to(socket.id).emit(
                        "chat-message",
                        message.data,
                        message.sender,
                        message["socket-id-sender"]
                    );

                });

            }

        });


        // =========================
        // SIGNAL
        // =========================

        socket.on("signal", (toId, message) => {

            if (!toId || !message) {
                return;
            }

            io.to(toId).emit(
                "signal",
                socket.id,
                message
            );

        });


        // =========================
        // CHAT MESSAGE
        // =========================

        socket.on("chat-message", (data, sender) => {

            let matchingRoom = null;

            for (
                const [roomKey, roomValue]
                of Object.entries(connections)
            ) {

                if (roomValue.includes(socket.id)) {

                    matchingRoom = roomKey;
                    break;

                }

            }

            if (matchingRoom === null) {
                return;
            }

            if (messages[matchingRoom] === undefined) {
                messages[matchingRoom] = [];
            }

            const newMessage = {
                data: data,
                sender: sender,
                "socket-id-sender": socket.id
            };

            messages[matchingRoom].push(newMessage);

            connections[matchingRoom].forEach((userId) => {

                io.to(userId).emit(
                    "chat-message",
                    data,
                    sender,
                    socket.id
                );

            });

        });


        // =========================
        // DISCONNECT
        // =========================

        socket.on("disconnect", () => {

            console.log(
                "Socket disconnected:",
                socket.id
            );

            if (timeOnLine[socket.id]) {

                const diffTime =
                    Math.abs(
                        new Date() -
                        timeOnLine[socket.id]
                    );

                console.log(
                    "Online time:",
                    diffTime,
                    "ms"
                );

                delete timeOnLine[socket.id];

            }

            let matchingRoom = null;

            for (
                const [roomKey, roomValue]
                of Object.entries(connections)
            ) {

                if (roomValue.includes(socket.id)) {

                    matchingRoom = roomKey;
                    break;

                }

            }

            if (matchingRoom === null) {
                return;
            }

            const index =
                connections[matchingRoom].indexOf(
                    socket.id
                );

            if (index !== -1) {

                connections[matchingRoom].splice(
                    index,
                    1
                );

            }

            // Tell remaining users that this user left

            connections[matchingRoom].forEach((userId) => {

                io.to(userId).emit(
                    "user-left",
                    socket.id
                );

            });

            // Delete empty room

            if (connections[matchingRoom].length === 0) {

                delete connections[matchingRoom];
                delete messages[matchingRoom];

            }

        });

    });
};