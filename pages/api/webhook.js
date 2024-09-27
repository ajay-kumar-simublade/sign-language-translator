// pages/api/webhook.js

import { Server as SocketServer } from "socket.io";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const data = req.body;

    const io = res.socket.server.io;
    if (data.event_type === "conversation.utterance" && role === "replica") {
      if (io) {
        io.emit("message", data);
      }
    }

    // Respond to the webhook source with a 200 status
    res.status(200).json({ message: "Webhook received and broadcasted" });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
