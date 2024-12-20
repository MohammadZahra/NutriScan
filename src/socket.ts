import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initSocket = (httpServer: HttpServer): Server => {
    if (io) { return io; }

    io = new Server(httpServer, {
        cors: {
            origin: "*",                     // Update this with frontend's URL
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected: ", socket.id);

        socket.on("message", (msg) => {
            console.log("Message received: ", msg);
            io.emit("message", msg);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected: ", socket.id);
        });
    });
    return io;
};

export const getSocketIO = (): Server => {
    if (!io) {
        throw new Error("Socket.io not initialized. You may need to call initSocket first.");
    }
    return io;
};