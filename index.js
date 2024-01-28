const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
// const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 7000;

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  socket.on("join", ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on("code-change", ({ roomId, newCode }) => {
    socket.in(roomId).emit("code-change", { newCode });
  });

  socket.on("sync-code", ({ socketId, newCode }) => {
    io.to(socketId).emit("code-change", { newCode });
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
