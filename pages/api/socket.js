// pages/api/socket.js

import { Server as SocketServer } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io");
    const io = new SocketServer(res.socket.server);
    res.socket.server.io = io;
  }
  res.end();
}
