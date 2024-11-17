import { KlineChart } from "./kline.js";

// MAIN
const main = () => {
  const klineChart = new KlineChart("tvchart");

  const socket = io("http://127.0.0.1:4000");

  socket.on("kline", (data) => {
    if (Array.isArray(data)) {
      klineChart.loadHistoricalData(data);
    } else {
      klineChart.updateKline(data);
    }
  });

  socket.on("connect", () => {
    console.log("Connected to the Socket.IO server.");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from the Socket.IO server.");
  });
};

main();
