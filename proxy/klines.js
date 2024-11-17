import { EMA, MACD, RSI, SMA } from "@debut/indicators";
import got from "got";
import WebSocket from "ws";

export class BinanceKlineWS {
  constructor(symbol = "BTCUSDT", interval = "1m") {
    this.symbol = symbol.toLowerCase();
    this.interval = interval;
    this.klines = new Map();
    this.sma = new SMA(200);
    this.ema = new EMA(21);
    this.rsi = new RSI(14);
    this.macd = new MACD(12, 26, 9);
    this.long = false;
    this.short = false;
    this.initialize();
  }

  async initialize() {
    try {
      // FETCH
      const response = await got(
        `https://api.binance.com/api/v3/klines?symbol=${this.symbol.toUpperCase()}&interval=${
          this.interval
        }&limit=1000`
      ).json();

      // STORE HISTORICAL KLINES IN THE MAP
      response.forEach((kline, i) => {
        const formattedData = {
          time: Math.round(kline[0] / 1000),
          open: Number(kline[1]),
          high: Number(kline[2]),
          low: Number(kline[3]),
          close: Number(kline[4]),
          volume: Number(kline[5]),
          sma:
            i === response.length - 1
              ? this.sma.momentValue(Number(kline[4]))
              : this.sma.nextValue(Number(kline[4])),
          ema:
            i === response.length - 1
              ? this.ema.momentValue(Number(kline[4]))
              : this.ema.nextValue(Number(kline[4])),
          rsi:
            i === response.length - 1
              ? this.rsi.momentValue(Number(kline[4]))
              : this.rsi.nextValue(Number(kline[4])),
          macd:
            i === response.length - 1
              ? this.macd.momentValue(Number(kline[4]))
              : this.macd.nextValue(Number(kline[4])),
        };

        this.klines.set(formattedData.time, formattedData);
      });

      const data = this.markers_inc(this.klines);
      this.klines = data;

      this.connect();
    } catch (error) {
      console.log("Error fetching historical klines: ", error);
    }
  }

  connect() {
    this.ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`
    );

    this.ws.on("open", () => {
      console.log(
        `Connected to Binance WebSocket for ${this.symbol} ${this.interval} klines`
      );
    });

    this.ws.on("message", (data) => {
      const parsedData = JSON.parse(data);
      if (parsedData.e !== "kline") return;

      const kline = parsedData.k;
      const isFinal = kline.x;
      const formattedData = {
        time: Math.round(kline.t / 1000),
        open: Number(kline.o),
        high: Number(kline.h),
        low: Number(kline.l),
        close: Number(kline.c),
        volume: Number(kline.v),
        sma: isFinal
          ? this.sma.nextValue(Number(kline.c))
          : this.sma.momentValue(Number(kline.c)),
        ema: isFinal
          ? this.ema.nextValue(Number(kline.c))
          : this.ema.momentValue(Number(kline.c)),
        rsi: isFinal
          ? this.rsi.nextValue(Number(kline.c))
          : this.rsi.momentValue(Number(kline.c)),
        macd: isFinal
          ? this.macd.nextValue(Number(kline.c))
          : this.macd.momentValue(Number(kline.c)),
        long: false,
        short: false,
      };

      // Récupérer la dernière entrée ajoutée à la Map
      const lastKey = [...this.klines].pop(); // On transforme la Map en tableau, puis on récupère le dernier élément
      const lastValue = lastKey ? lastKey[1] : null; // lastKey[1] correspond à la valeur de la dernière entrée

      const newKline = this.update_markers(lastValue, formattedData);

      this.klines.set(newKline.time, newKline);

      // EMITS EVENT WITH KLINE DATA
      this.onKline(formattedData);
    });

    this.reconnectDelay = 5000; // Temps initial de reconnexion (5 secondes)
    this.maxReconnectDelay = 30000; // Temps maximal de reconnexion (30 secondes)

    this.ws.on("close", () => {
      console.log("Try to reconnect...");
      setTimeout(() => this.connect(), this.reconnectDelay);

      // Augmenter le délai de reconnexion de manière progressive
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    });

    this.ws.on("error", (error) => {
      console.log("WebSocket error: ", error);
    });
  }

  onKline(formattedData) {
    console.log("KLINE");
    console.log(formattedData);
  }

  markers_inc(data) {
    // Convertir la Map en tableau pour pouvoir accéder aux indices
    const entries = Array.from(data.entries());

    // Parcourir les entrées et ajouter `long` et `short`
    for (let i = 0; i < entries.length; i++) {
      const [key, d] = entries[i];
      const prev = i > 0 ? entries[i - 1][1] : null;

      const long = prev && d.ema > d.sma && prev.ema < prev.sma;
      const short = prev && d.ema < d.sma && prev.ema > prev.sma;

      // Mettre à jour l'objet avec les nouvelles propriétés
      data.set(key, { ...d, long, short });
    }

    return data; // Retourner la Map modifiée
  }

  update_markers(previousKline, newKline) {
    // Calculer les conditions 'long' et 'short' en comparant les EMAs et SMAs des deux klines
    const long =
      previousKline &&
      newKline.ema > newKline.sma &&
      previousKline.ema < previousKline.sma;
    const short =
      previousKline &&
      newKline.ema < newKline.sma &&
      previousKline.ema > previousKline.sma;

    // Retourner le nouveau kline avec les propriétés 'long' et 'short' ajoutées
    return {
      ...newKline, // On garde toutes les propriétés existantes de newKline
      long, // Ajoute la propriété 'long'
      short, // Ajoute la propriété 'short'
    };
  }

  // GET LATEST KLINES
  getKlines() {
    return Array.from(this.klines.values());
  }
}

export default BinanceKlineWS;
