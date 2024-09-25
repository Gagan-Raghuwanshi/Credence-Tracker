// sockets/socket.js
import { Server } from "socket.io";
import { History } from "../models/history.model.js";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  let dataForSocket = "";

  const dataCommingFromDB = async () => {

    const now = new Date(); // Current time
    const tenSecondsAgo = new Date(now.getTime() - 10 * 1000); // Time 10 seconds ago
    const allData = await History.find({ createdAt: { $gte: tenSecondsAgo, $lte: now } });
    // console.log("data comming from DB", allData);
    dataForSocket = allData;
  };

  // setInterval(() => {
      dataCommingFromDB();
  // }, 10000);

  io.on("connection", (socket) => {
    console.log("A new user connected", socket.id);
    socket.emit("user", `welcome back ${socket.id}`);

    // setInterval(() => {
      socket.emit("all data", dataForSocket);
    // }, 10000);
  });

  return io;
};
