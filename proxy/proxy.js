import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { BinanceKlineWS as Klines } from "./klines.js";

const PORT = 4000;
const app = express();

// CORS middleware
app.use(cors());

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// SOCKET IO PROXY
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const binanceKlinesWS = new Klines("BTCUSDT");

// HANDLE SOCKET.IO CONNECTIONS
io.on("connection", (socket) => {
  console.log("A user connected");

  // SEND HISTORICAL KLINES DATA TO THE NEW CLIENT
  socket.emit("kline", binanceKlinesWS.getKlines());

  binanceKlinesWS.onKline = (kline) => {
    socket.emit("kline", kline);
  };

  socket.on("disconnect", () => console.log("A user disconnected"));
});
