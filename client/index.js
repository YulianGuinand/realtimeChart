import { KlineChart } from "./kline.js";
import { PaiementClass } from "./paiement.js";

const priceInfo = document.querySelector(".price");
const volumeInfo = document.querySelector(".volume");
const emaSmaInfo = document.querySelector(".ema_sma");
const rsiInfo = document.querySelector(".rsi");
const macdInfo = document.querySelector(".macd");
const fullInfo = document.querySelector(".full");

// MAIN
const main = (found) => {
  const klineChart = new KlineChart("tvchart");
  const macdPaiementClass = new PaiementClass(found);
  const emaSmaPaiementClass = new PaiementClass(found);
  const rsiPaiementClass = new PaiementClass(found);
  const fullPaiementClass = new PaiementClass(found);

  const socket = io("http://127.0.0.1:4000");

  socket.on("kline", (data) => {
    if (Array.isArray(data)) {
      data.forEach((candle) => {
        // EMA - SMA
        if (candle.ema_sma_marker?.long) {
          emaSmaPaiementClass.buy(candle.close);
          fullPaiementClass.buy(candle.close);
        } else if (candle.ema_sma_marker?.short) {
          emaSmaPaiementClass.sell(candle.close);
          fullPaiementClass.sell(candle.close);
        }

        // RSI
        if (candle.rsi_markers?.long) {
          rsiPaiementClass.buy(candle.close);
          fullPaiementClass.buy(candle.close);
        } else if (candle.rsi_markers?.short) {
          rsiPaiementClass.sell(candle.close);
          fullPaiementClass.sell(candle.close);
        }

        // MACD
        if (candle.macd_markers?.long) {
          macdPaiementClass.buy(candle.close);
          fullPaiementClass.buy(candle.close);
        } else if (candle.macd_markers?.short) {
          macdPaiementClass.sell(candle.close);
          fullPaiementClass.sell(candle.close);
        }
      });
      klineChart.loadHistoricalData(data);

      emaSmaInfo.innerHTML = emaSmaPaiementClass.getData().found.toFixed(2);
      rsiInfo.innerHTML = rsiPaiementClass.getData().found.toFixed(2);
      macdInfo.innerHTML = macdPaiementClass.getData().found.toFixed(2);
      fullInfo.innerHTML = fullPaiementClass.getData().found.toFixed(2);
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

main(100000);
