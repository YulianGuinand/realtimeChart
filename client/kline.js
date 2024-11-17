// KLINECHART CLASS TO HANDLE THE RENDERING OF HISTORICAL AND REAL-TIME KLINES
export class KlineChart {
  constructor(domElementId) {
    this.chartProperties = {
      layout: {
        fontFamily: "'Roboto', sans-serif",
        background: { color: "#222" },
        textColor: "#DDD",
      },
      grid: {
        vertLines: { color: "#444" },
        horzLines: { color: "#444" },
      },
      timeScale: {
        borderColor: "#71649C",
        timeVisible: true,
        secondsVisible: true,
        barSpacing: 10,
      },
      priceScale: {
        borderColor: "#71649C",
      },
    };
    const domElement = document.getElementById(domElementId);
    this.chart = LightweightCharts.createChart(
      domElement,
      this.chartProperties
    );

    this.smaSeries = this.chart.addLineSeries({
      color: "orange",
      lineWidth: 5,
      pane: 0,
    });

    this.emaSeries = this.chart.addLineSeries({
      color: "green",
      lineWidth: 5,
      pane: 0,
    });
    this.rsiSeries = this.chart.addLineSeries({
      color: "red",
      lineWidth: 2,
      pane: 1,
    });
    this.overboughtSeries = this.chart.addLineSeries({
      color: "white",
      lineWidth: 2,
      pane: 1,
    });
    this.oversoldSeries = this.chart.addLineSeries({
      color: "white",
      lineWidth: 2,
      pane: 1,
    });

    this.macdHistogramSeries = this.chart.addHistogramSeries({ pane: 2 });
    this.macdFastSeries = this.chart.addLineSeries({
      color: "white",
      lineWidth: 1,
      pane: 2,
    });
    this.macdSlowSeries = this.chart.addLineSeries({
      color: "red",
      lineWidth: 1,
      pane: 2,
    });

    // INITIALIZE CHART SERIES
    this.candleseries = this.chart.addCandlestickSeries({
      wickUpColor: "rgb(54, 116, 217)",
      upColor: "rgb(54, 116, 217)",
      wickDownColor: "rgb(225, 50, 85)",
      downColor: "rgb(225, 50, 85)",
      borderVisible: false,
    });

    // AREA SERIES
    this.areaSeries = this.chart.addAreaSeries({
      lastValueVisible: false, // hide the last value marker for this series
      crosshairMarkerVisible: false, // hide the crosshair marker for this series
      lineColor: "transparent", // hide the line
      topColor: "rgba(56, 33, 110,0.6)",
      bottomColor: "rgba(56, 33, 110, 0.1)",
    });
  }

  loadHistoricalData(klinedata) {
    // SET INITIAL DATA FOR EACH SERIES

    const lineData = klinedata.map((datapoint) => ({
      time: datapoint.time,
      value: (datapoint.close + datapoint.open) / 2,
    }));
    this.areaSeries.setData(lineData);

    this.candleseries.setData(klinedata);

    this.smaSeries.setData(this.extractData(klinedata, "sma"));
    this.emaSeries.setData(this.extractData(klinedata, "ema"));
    this.rsiSeries.setData(this.extractData(klinedata, "rsi"));
    this.overboughtSeries.setData(this.rsiLinesData(klinedata, true));
    this.oversoldSeries.setData(this.rsiLinesData(klinedata, false));

    this.macdHistogramSeries.setData(
      this.extractNestedData(klinedata, "macd.histogram").map((d) => ({
        color: d.value > 0 ? "mediumaquamarine" : "indianred",
        ...d,
      }))
    );
    this.macdFastSeries.setData(this.extractNestedData(klinedata, "macd.macd"));
    this.macdSlowSeries.setData(
      this.extractNestedData(klinedata, "macd.signal")
    );

    console.log("loaded historical data.");
  }

  extractData(klinedata, key) {
    return klinedata
      .filter((d) => d[key] !== undefined)
      .map((d) => ({ time: d.time, value: d[key] }));
  }

  rsiLinesData(klinedata, isOverBought = true) {
    return klinedata
      .filter((d) => d["rsi"] !== undefined)
      .map((d) => ({ time: d.time, value: isOverBought ? 70 : 30 }));
  }

  extractNestedData(klinedata, key) {
    const [outerKey, innerKey] = key.split(".");
    return klinedata
      .filter((d) => d[outerKey] && d[outerKey][innerKey] !== undefined)
      .map((d) => ({ time: d.time, value: d[outerKey][innerKey] }));
  }

  updateKline(kline) {
    this.areaSeries.update({
      time: kline.time,
      value: (kline.close + kline.open) / 2,
    });

    this.candleseries.update(kline);
    if (kline.sma) {
      this.smaSeries.update({ time: kline.time, value: kline.sma });
    }
    if (kline.ema) {
      this.emaSeries.update({ time: kline.time, value: kline.ema });
    }
    if (kline.rsi) {
      this.rsiSeries.update({ time: kline.time, value: kline.ema });
      this.overboughtSeries.update({ time: kline.time, value: 70 });
      this.oversoldSeries.update({ time: kline.time, value: 30 });
    }
    if (kline.macd) {
      const { macd, signal, histogram } = kline.macd;
      this.macdHistogramSeries.update({ time: kline.time, value: histogram });
      this.macdFastSeries.update({ time: kline.time, value: macd });
      this.macdSlowSeries.update({ time: kline.time, value: signal });
    }
  }
}
