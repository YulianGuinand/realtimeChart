import { KlineChart } from "./kline.js";

const priceInfo = document.querySelector(".price");
const volumeInfo = document.querySelector(".volume");

// MAIN
const main = () => {
  const klineChart = new KlineChart("tvchart");

  const socket = io("http://127.0.0.1:4000");

  socket.on("kline", (data) => {
    if (Array.isArray(data)) {
      klineChart.loadHistoricalData(data);
    } else {
      const lastPrice = priceInfo.innerHTML;
      if (data.close >= lastPrice) {
        priceInfo.classList.remove("red");
        priceInfo.classList.add("green");
      } else {
        priceInfo.classList.remove("green");
        priceInfo.classList.add("red");
      }

      priceInfo.innerHTML = data.close;
      // VOLUME
      const lastVolume = volumeInfo.innerHTML;
      if (data.volume >= lastVolume) {
        volumeInfo.classList.remove("red");
        volumeInfo.classList.add("green");
      } else {
        volumeInfo.classList.remove("green");
        volumeInfo.classList.add("red");
      }
      volumeInfo.innerHTML = data.volume;
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
