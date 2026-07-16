import {
  allPairs,
  removeLoading,
  favCountries,
  tabBadge,
  favBtn,
  logConv,
  dataDates,
  dataRates,
  puttingData,
} from "./script.js";

// ===== DOM SELECTORS =====
const receiveInput = document.querySelector("#receiveAmount");
const rate_text = document.querySelector(".rate-text");
const favList = document.querySelector(".favorites-list");
const logList = document.querySelector("#log-list");
const compareList = document.querySelector("#compare-list");
export const logLength = document.querySelector("#log-tab-badge");
const comparePairs = document.querySelector("#compare-count");

// ===== STATE =====
const ids = ["ticker-1", "ticker-2"];
const apiKeySocket = "d8vkrh9r01qgrv4p4okgd8vkrh9r01qgrv4p4ol0";
let pingCounts = 0; // this is when market is closed
let marketClosedTimer; // this is for when market is closed
const openMarket = {}; // this if for when market open price
const currentPrice = {}; // this is for what is current price
let allCurrencies = {}; // this is for comapre one only but for showing what currencies are called in all the countries
let compareBase = null; // this is for compare one
const socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKeySocket}`);

// these are for the flags
export const currencyToCountry = {
  AUD: "au",
  BRL: "br",
  CAD: "ca",
  CHF: "ch",
  CNY: "cn",
  CZK: "cz",
  DKK: "dk",
  EUR: "eu",
  GBP: "gb",
  HKD: "hk",
  HUF: "hu",
  IDR: "id",
  ILS: "il",
  INR: "in",
  ISK: "is",
  JPY: "jp",
  KRW: "kr",
  MXN: "mx",
  MYR: "my",
  NOK: "no",
  NZD: "nz",
  PHP: "ph",
  PLN: "pl",
  RON: "ro",
  SEK: "se",
  SGD: "sg",
  THB: "th",
  TRY: "tr",
  USD: "us",
  ZAR: "za",
};

// In this all teh logic for connecting socket
export function connectSocket() {
  socket.addEventListener("open", (event) => {
    marketClosedTimer = setTimeout(() => {
      marketClosed();
    }, 15000);
    allPairs.forEach((pair) => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          symbol: pair,
        }),
      );
    });
  });

  socket.addEventListener("message", (event) => {
    const jsonData = JSON.parse(event.data);
    if (jsonData.type === "ping") pingCounts++;
    if (pingCounts >= 3) {
      marketClosed();
      return;
    }

    if (jsonData.type !== "trade") return;

    clearTimeout(marketClosedTimer);
    pingCounts = 0;
    jsonData.data.forEach((info) => {
      removeLoading();
      const country = info.s;
      const price = info.p;

      if (!openMarket[country]) {
        openMarket[country] = price;
      }
      currentPrice[country] = price;

      updateHTML(country, price);
    });
  });

  socket.addEventListener("close", () => {
    console.log("Disconnected .. connecting again");
    setTimeout(connectSocket, 3000);
  });

  socket.addEventListener("error", (err) => {
    socket.close();
  });
}

// this is of that live tracker html change
export function updateHTML(country, price) {
  const displayCountry = country.replace("OANDA:", "").replace("_", "/");
  const nowPrice = price - openMarket[country];
  const pctPrice = ((nowPrice / openMarket[country]) * 100).toFixed(2);
  const arrow = nowPrice >= 0 ? "▲" : "▼";
  const itemClass = nowPrice >= 0 ? "positive" : "negative";

  ids.forEach((ticketId) => {
    let item = document.querySelector(
      `#${ticketId}  [data-pair="${displayCountry}"]`,
    );

    if (!item) {
      item = document.createElement("div");
      item.className = `ticker-item  ${itemClass}`;
      item.dataset.pair = displayCountry;
      item.innerHTML = ` <span class="currency-pair">${displayCountry}</span>
           <span class="rate">${price.toFixed(4)}</span>
           <span class="arrow">${arrow}</span>
          <span class="percentage">${nowPrice >= 0 ? `+${pctPrice}%` : `${pctPrice}%`}</span>`;

      document.querySelector(`#${ticketId}`).appendChild(item);
    } else {
      item.className = `ticker-item  ${itemClass}`;
      item.querySelector(".rate").textContent = price.toFixed(4);
      item.querySelector(".arrow").textContent = arrow;
      item.querySelector(".percentage").textContent =
        `${nowPrice >= 0 ? `+${pctPrice}%` : `${pctPrice}%`}`;
    }
  });
}

// when the market is closed.
function marketClosed() {
  document.querySelector(".ticker-badge").innerHTML =
    `<span  class="live-dot"  style="color:red">●</span> MARKET CLOSED`;
  document.querySelector("#ticker-1").innerHTML =
    ` <span class = "market-closed">Market closed...</span>`;
}

// for api call for conversion.... IN THIS ONE FROM AND TO MISSING IN THE PARAMETER
export async function apiCallMoney(amount, from, to) {
  const trimAmount = amount.trim();
  if (trimAmount === "") {
    receiveInput.value = "";
    rate_text.textContent = "";
  }
  if (!trimAmount) return;

  if (from === to) {
    receiveInput.value = trimAmount;
    rate_text.textContent = `${trimAmount} ${from} = ${trimAmount} ${to}`;
    return;
  }

  const apiUrl = `https://api.frankfurter.dev/v1/latest?amount=${trimAmount}&from=${from}&to=${to}`;
  try {
    const data = await fetch(apiUrl, {
      cache: "no-store",
    });
    if (!data.ok) throw new Error("Something went wrong");
    const jsonData = await data.json();

    const rate = Number(jsonData.rates[to]);
    receiveInput.value = rate;
    rate_text.textContent = `${trimAmount} ${from} = ${rate} ${to}`;
  } catch (err) {
    console.log(err);
  }
}

// this is for stat one of open , last change , pctChange.
export async function apiCallData(from, to, dateDay) {
  if (from === to) {
    return {
      Open: 1,
      Last: 1,
      Change: "0.0000",
      pctChange: "0.00",
    };
  }
  const end = new Date();
  end.setDate(end.getDate() - 1);

  const format = (date) => date.toISOString().split("T")[0];

  try {
    const apiUrlRange = `https://api.frankfurter.dev/v1/${format(dateDay)}..${format(end)}?from=${from}&to=${to}`;

    const rangeRes = await fetch(apiUrlRange);
    if (!rangeRes.ok) throw new Error("Failed to fetch yesterday's rate");
    const jsonRange = await rangeRes.json();

    const dates = Object.keys(jsonRange.rates);

    if (dates.length === 0) {
      throw new Error("No exchange rate data found.");
    }
    puttingData(jsonRange);
    renderGraph();
    const firstDate = dates[0];
    const lastDate = dates.at(-1);

    if (jsonRange.rates[lastDate]?.[to] === undefined)
      throw new Error(`No rate found for ${to}`);

    if (jsonRange.rates[firstDate]?.[to] === undefined)
      throw new Error(`No rate found for ${to}`);

    const Open = jsonRange.rates[firstDate][to];
    const Last = jsonRange.rates[lastDate][to];
    const Change = (Last - Open).toFixed(4);
    const pctChange = (((Last - Open) / Open) * 100).toFixed(2);
    return { Open, Last, Change, pctChange };
  } catch (err) {
    console.log(err);
    return null;
  }
}

// for showing the countries in drop down.
export async function apiCallDropdown() {
  try {
    const data = await fetch("https://api.frankfurter.dev/v1/currencies?");
    if (!data.ok) throw new Error("Something went wrong");

    const jsonFormat = await data.json();
    allCurrencies = jsonFormat;
    return jsonFormat;
  } catch (err) {
    console.log(err);
    return null;
  }
}

// for showing the compare list one.
export async function apiCallCompare(from) {
  const apiCallUrl = `https://api.frankfurter.dev/v1/latest?from=${from}`;
  try {
    const data = await fetch(apiCallUrl, {
      cache: "no-store",
    });

    if (!data.ok) throw new Error("Something went wrong");

    const jsonFormat = await data.json();
    return jsonFormat;
  } catch (err) {
    console.log(err);
    return null;
  }
}

// this is for fav countrie html
export function renderFavList() {
  if (favCountries.length === 0) {
    favList.innerHTML = `<p class="favorites-empty">No favorites yet!</p>`;
    return;
  }

  favList.innerHTML = favCountries
    .map((favCot) => {
      return ` <li class="favorites-item">
            <span class="fav-pair">${favCot}</span>
            <button class="fav-remove" data-pair="${favCot}">Remove</button>
        </li>`;
    })
    .join("");

  favList.querySelectorAll(".fav-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pair = btn.dataset.pair;
      const index = favCountries.indexOf(pair);
      if (index !== -1) favCountries.splice(index, 1);
      tabBadge.textContent = favCountries.length;
      favBtn.classList.add("remove");
      favBtn.textContent = "FAVORITE";
      renderFavList();
      saveToStorage();
    });
  });
}

// this is for log conversion html
export function renderLogConv() {
  if (logConv.length === 0) {
    logList.innerHTML = `<p class="favorites-empty">No log conversions yet!</p>`;
    return;
  }

  logList.innerHTML = logConv
    .map((data) => {
      return `<li class="log-item">
      <span class="log-pair">${data.pair}</span>
      <span class="log-amount">${data.amount}</span>
     <button class="fav-remove" data-pair="${data.amount}">Remove</button>
    </li>`;
    })
    .join("");

  logList.querySelectorAll(".fav-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dataPair = btn.dataset.pair;
      const index = logConv.findIndex((log) => {
        return log.amount === dataPair;
      });
      if (index != -1) {
        logConv.splice(index, 1);
      }
      renderLogConv();
      saveToStorageLog();
    });
  });

  logLength.textContent = logConv.length;
}

// this is for calling the making the html of that compare btn
export async function renderCompareConv(from, amount) {
  if (!compareBase || compareBase.base !== from) {
    compareBase = await apiCallCompare(from);
  }

  if (!compareBase) return;
  let html = "";
  comparePairs.textContent = Object.keys(compareBase.rates).length;
  for (const keys of Object.keys(compareBase.rates)) {
    html += ` <li class="compare-item">
                        <div class="compare-left">
                            <img src="https://flagcdn.com/w20/${currencyToCountry[keys]}.png" alt="${keys}" class="compare-flag">
                            <span class="compare-code">${keys}</span>
                            <span class="compare-name">${allCurrencies[keys]}</span>
                        </div>
                        <div class="compare-right">
                            <span class="compare-converted">${(compareBase.rates[keys] * amount).toFixed(4)}</span>
                            <span class="compare-rate">@ ${compareBase.rates[keys]}</span>
                        </div>
                    </li>`;
  }

  compareList.innerHTML = html;
}

// this is for local storage of favList
export function saveToStorage() {
  localStorage.setItem("favItems", JSON.stringify(favCountries));
}

// this is for log list local storage
export function saveToStorageLog() {
  localStorage.setItem("logItems", JSON.stringify(logConv));
}

//this is  for when it already in the fav countries array then btn should be favourited
export function updateFavBtn(sendCtry, receivedCtry) {
  if (favCountries.includes(`${sendCtry}/${receivedCtry}`)) {
    favBtn.classList.remove("remove");
    favBtn.innerHTML = `<img src="assets/star.png" class="starImage">FAVORITED`;
  } else {
    favBtn.classList.add("remove");
    favBtn.textContent = "FAVORITE";
  }
}



export function renderGraph() {
  const minRate = Math.min(...dataRates);
  const maxRate = Math.max(...dataRates);
  const total = dataRates.length;

  if (total === 0) return;


  const range = maxRate - minRate || 1;

  const points = dataRates.map((rate, index) => {
    const x = total === 1 ? 0 : (index / (total - 1)) * 500;
    const y = 200 - ((rate - minRate) / range) * 200;
    return { x, y };
  });


  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");


  const areaPath =
    `M ${points[0].x.toFixed(2)},200 ` +
    points.map((p) => `L ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") +
    ` L ${points[points.length - 1].x.toFixed(2)},200 Z`;


  document.querySelector(".graph-fill").setAttribute("d", areaPath);
  document.querySelector(".graph-line").setAttribute("d", linePath);


  const yLabels = document.querySelectorAll(".y-axis .axis-label");
  yLabels[0].textContent = maxRate.toFixed(5);
  yLabels[1].textContent = ((maxRate + minRate) / 2).toFixed(5);
  yLabels[2].textContent = minRate.toFixed(5);


  const xLabels = document.querySelectorAll(".x-axis .axis-label");
  const step = (dataDates.length - 1) / (xLabels.length - 1);
  xLabels.forEach((label, i) => {
    const idx = Math.round(i * step);
    const d = new Date(dataDates[idx]);
    label.textContent = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  });


  const lastRate = dataRates[dataRates.length - 1];
  const lastDate = new Date(dataDates[dataDates.length - 1]);
  document.querySelector(".chart-metadata").textContent =
    `${lastRate.toFixed(4)} · ${lastDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
}
