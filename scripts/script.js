import {
  updateHTML,
  connectSocket,
  apiCallMoney,
  apiCallData,
  apiCallDropdown,
  currencyToCountry,
  renderFavList,
  saveToStorage,
  updateFavBtn,
  renderLogConv,
  saveToStorageLog,
  logLength,
  apiCallCompare,
  renderCompareConv,
  renderGraph,
} from "./api.js";

// ===== DOM SELECTORS =====
const sendInput = document.querySelector("#sendAmount");
const receiveInput = document.querySelector("#receiveAmount");
const stat_container = document.querySelector(".stats-container");
const dropdown_ui = document.querySelectorAll(".currency-list");
const receiveBtn = document.querySelector("#receive-btn");
const receiveDropdown = document.querySelector("#receive-dropdown");
const sendBtn = document.querySelector("#send-btn");
const sendDropdown = document.querySelector("#send-dropdown");
export const favBtn = document.querySelector("#fav");
const logBtn = document.querySelector("#conversion");
const tabs = document.querySelectorAll(".tab");
const historyView = document.querySelector("#history-view");
const favoritesView = document.querySelector("#favorites-view");
const logView = document.querySelector("#log-view");
const compareView = document.querySelector("#compare-view");
const logClearBtn = document.querySelector("#log-clear");
export const tabBadge = document.querySelector("#fav-tab-badge");
const search_currency = document.querySelectorAll(".currency-search");
const compareFrom = document.querySelector("#compare-from");
const timePillBtn = document.querySelectorAll(".time-btn");

// ===== STATE =====
const stat_card = ["Open", "Last", "Change", "% Change"]; // this is for the history one stat
let amount = "";
let sendCountry = "USD";
let receivedCountry = "EUR";
export let dataDates = [];
export let dataRates = [];
export const favCountries = JSON.parse(localStorage.getItem("favItems")) || [
  `${sendCountry}/${receivedCountry}`,
]; // this one is for the favourite btn when clicked.
export const logConv = JSON.parse(localStorage.getItem("logItems")) || []; //  this one is for the log btn when clicked.

tabBadge.textContent = favCountries.length; // this is for showing how many favourites do i have
logLength.textContent = logConv.length; // this is for showing how many logs

// this one is for when you first start or like reload at that time this will run
document.addEventListener("DOMContentLoaded", () => {
  sendInput.value = 1;
  apiCallMoney(String(1), sendCountry, receivedCountry);
});

// these are for live tracker
const pairs = [
  "USDJPY",
  "GBPUSD",
  "USDCHF",
  "EURGBP",
  "AUDUSD",
  "USDCAD",
  "EURUSD",
  "NZDUSD",
];

// changing them in a format of how websocket take them
export const allPairs = pairs.map(
  (pair) => `OANDA:${pair.slice(0, 3)}_${pair.slice(3)}`,
);

// websocketing connection
connectSocket();

let isLoading = true;
// this is when it takes time to fetch data
export function removeLoading() {
  if (!isLoading) return;
  isLoading = false;

  const el = document.querySelector(".loading-text");
  if (el) el.remove();
}

// this one is for knowing what they have typed in the send input
sendInput.addEventListener("input", () => {
  amount = sendInput.value;
  apiCallMoney(amount, sendCountry, receivedCountry);

  if (compareView.style.display === "block") {
    renderCompareConv(sendCountry, amount || 1);
  }
});

// getting that stat data the one open , closed , change one..
async function getStat(dates) {
  const stat_data = await apiCallData(sendCountry, receivedCountry, dates);
  if (!stat_data) {
    stat_container.innerHTML = stat_card
      .map((card) => {
        return `<div class="stats-card">
        <span class="stat-level">${card.toUpperCase()}</span>
        <span class="stat-value">--</span>
      </div>`;
      })
      .join("");

    return;
  }

  let cardHtml = "";
  const isPositive = Number(stat_data["Change"]) >= 0;
  stat_card.forEach((card) => {
    const isNeutral = card === "Open" || card === "Last";
    const value =
      card === "% Change" ? stat_data["pctChange"] : stat_data[card];
    const sign = isNeutral
      ? value
      : card === "% Change"
        ? isPositive
          ? `▲ +${value}%`
          : `▼ ${value}%`
        : isPositive
          ? `+${value}`
          : value;

    cardHtml += `<div class="stats-card">
                  <span class="stat-level">${card.toUpperCase()}</span>
                  <span class="stat-value  ${card === "Open" || card === "Last" ? "" : isPositive === true ? "positive" : "negative"}">${sign}</span>
              </div>`;
  });

  stat_container.innerHTML = cardHtml;
}

const dayToday = new Date().getDay();
const daysMinus = dayToday === 1 ? 4 : dayToday === 0 ? 3 : 2;
const dayyesterday = new Date();
dayyesterday.setDate(dayyesterday.getDate() - daysMinus);

getStat(dayyesterday);

// this is the dropdown of those of choosing the countries the one btn i have which when click show the countries.
async function dropdown() {
  const dropdown_data = await apiCallDropdown();

  if (!dropdown_data) return;

  let html = "";
  for (const keys of Object.keys(dropdown_data)) {
    const countryCode = currencyToCountry[keys] || "un";
    html += `<li data-code="${keys}">
     <img src="https://flagcdn.com/w20/${countryCode}.png" alt="${keys}">
    <span>${keys}</span> 
    </li>`;
  }

  dropdown_ui.forEach((ui) => {
    ui.innerHTML = html;
    ui.querySelectorAll("li").forEach((list) => {
      list.addEventListener("click", () => {
        const code = list.dataset.code;
        const img = list.querySelector("img").src;

        if (ui.id === "send-list") {
          sendCountry = code;
          compareFrom.textContent = sendCountry;
          document.querySelector("#send-currency").textContent = code;
          document.querySelector("#send-flag").src = img;
        } else if (ui.id === "receive-list") {
          receivedCountry = code;
          document.querySelector("#receive-currency").textContent = code;
          document.querySelector("#receive-flag").src = img;
        }

        ui.closest(".currency-dropdown").style.display = "none";
        apiCallMoney(amount || "1", sendCountry, receivedCountry);
        getStat(dayyesterday);

        updateFavBtn(sendCountry, receivedCountry);
        renderCompareConv(sendCountry, sendInput.value || 1);
      });
    });
  });
}

dropdown();

// this is recevied side input btn
receiveBtn.addEventListener("click", () => {
  const isOpen = receiveDropdown.style.display === "block";
  receiveDropdown.style.display = isOpen ? "none" : "block";
});

// this is send side input btn
sendBtn.addEventListener("click", () => {
  const isOpen = sendDropdown.style.display === "block";
  sendDropdown.style.display = isOpen ? "none" : "block";
});

// this is for like when clicked outside dropdown close.
document.addEventListener("click", (e) => {
  dropdown_ui.forEach((ui) => {
    const dropdown = ui.closest(".currency-dropdown");
    const button = dropdown.previousElementSibling;
    if (!dropdown.contains(e.target) && !button.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
});

// this is for the history , fav tabs
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    historyView.style.display = "none";
    favoritesView.style.display = "none";
    logView.style.display = "none";
    compareView.style.display = "none";
    if (tab.dataset.tab === "history") {
      historyView.style.display = "block";
    } else if (tab.dataset.tab === "favorites") {
      favoritesView.style.display = "block";
      tabBadge.textContent = favCountries.length;
      renderFavList();
    } else if (tab.dataset.tab === "log") {
      logView.style.display = "block";
      renderLogConv();
    } else if (tab.dataset.tab === "compare") {
      compareView.style.display = "block";
      renderCompareConv(sendCountry, sendInput.value || 1);
    }
  });
});

// this is for fav tab btn
favBtn.addEventListener("click", () => {
  if (favBtn.classList.contains("remove")) {
    favBtn.classList.remove("remove");
    favBtn.innerHTML = `<img src="assets/star.png" class="starImage">FAVORITED`;

    if (!favCountries.includes(`${sendCountry}/${receivedCountry}`)) {
      favCountries.push(`${sendCountry}/${receivedCountry}`);
      tabBadge.textContent = favCountries.length;
      renderFavList();
      saveToStorage();
    }
  } else {
    favBtn.classList.add("remove");
    favBtn.textContent = "FAVORITE";
    const index = favCountries.indexOf(`${sendCountry}/${receivedCountry}`);
    if (index !== -1) favCountries.splice(index, 1);
    tabBadge.textContent = favCountries.length;
    renderFavList();
    saveToStorage();
  }
});

// this is when it already in the fav countries array then btn should be favourited
updateFavBtn(sendCountry, receivedCountry);

// this is for that search input
search_currency.forEach((search) => {
  search.addEventListener("input", () => {
    const word = search.value.trim().toUpperCase();

    const search_id =
      search.id === "send-search" ? "#send-list" : "#receive-list";
    const lis = document.querySelectorAll(`${search_id} li`);

    lis.forEach((l) => {
      const text = l.textContent;

      if (text.includes(word)) {
        l.style.display = "flex";
      } else {
        l.style.display = "none";
      }
    });
  });
});

// this is for log conversion one to push in the array of log
logBtn.addEventListener("click", () => {
  const exist = logConv.some(
    (user) =>
      user.pair === `${sendCountry}/${receivedCountry}` &&
      user.amount ===
        `${sendInput.value} ${sendCountry} -> ${receiveInput.value} ${receivedCountry}`,
  );

  if (!exist) {
    logConv.push({
      pair: `${sendCountry}/${receivedCountry}`,
      amount: `${sendInput.value} ${sendCountry} -> ${receiveInput.value} ${receivedCountry}`,
    });
  }

  renderLogConv();
  saveToStorageLog();
});

// this is for when in log clear btn is clicked
logClearBtn.addEventListener("click", () => {
  logConv.length = 0;
  logLength.textContent = logConv.length;
  renderLogConv();
  saveToStorageLog();
});

timePillBtn.forEach((timeBtn) => {
  timeBtn.addEventListener("click", async () => {
    timePillBtn.forEach((btn) => btn.classList.remove("active"));
    timeBtn.classList.add("active");

    const startDate = getStartDate(timeBtn.textContent);
    getStat(startDate);
  });
});

export function puttingData(data) {
  dataDates = [];
  dataRates = [];
  for (const keys of Object.keys(data.rates)) {
    dataDates.push(keys);
  }
  for (const key of Object.keys(data.rates)) {
    dataRates.push(data.rates[key][receivedCountry]);
  }
}

function getStartDate(period) {
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const date = new Date(end);

  if (period === "1D") {
    const day = new Date().getDay();
    const daysBack = day === 1 ? 4 : day === 0 ? 3 : 2;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - daysBack);
    return yesterday;
  } else if (period === "1W") {
    date.setDate(date.getDate() - 6);
  } else if (period === "1M") {
    const month = new Date(end);
    date.setMonth(date.getMonth() - 1);
  } else if (period === "3M") {
    date.setMonth(date.getMonth() - 3);
  } else if (period === "1Y") {
    date.setFullYear(date.getFullYear() - 1);
  } else if (period === "5Y") {
    date.setFullYear(date.getFullYear() - 5);
  }

  return date;
}
