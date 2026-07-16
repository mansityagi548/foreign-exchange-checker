💱 Currency Converter

A dark-themed, live currency converter built with vanilla HTML, CSS, and JavaScript — featuring a real-time price ticker, historical rate charts, favorites, conversion logs, and multi-currency comparison.

✨ Features


🔄 Live conversion — convert between 55+ currencies using real exchange rate data

📡 Live market ticker — real-time forex pair prices (USD/JPY, EUR/USD, etc.) streamed via WebSocket, scrolling marquee-style across the header


📈 Historical rate chart — SVG line + area chart showing how a pair has moved over time (1D / 1W / 1M / 3M / 1Y / 5Y)

⭐ Favorites — save currency pairs you check often, stored in localStorage

🧾 Conversion log — keep a running log of past conversions, also persisted locally

🌍 Compare view — see one currency converted against all other currencies at once

🔍 Searchable dropdowns — quickly find a currency by typing instead of scrolling

🚦 Market-closed detection — automatically shows a "market closed" state when live prices stop streaming

🛠️ Built With


HTML / CSS / JavaScript (no frameworks — vanilla all the way)

Frankfurter API — exchange rates (conversion, historical data, currency list)

Finnhub WebSocket API — live forex price streaming

flagcdn.com — currency flag icons

JetBrains Mono (Google Fonts) — the monospace font powering the whole UI

📂 Project Structure

├── index.html          # Markup — converter, tabs, ticker, chart

├── style.css           # Dark theme styling, responsive breakpoints

└── scripts/

    ├── script.js        # DOM logic, event listeners, state, dropdowns
    
    └── api.js           # API calls, WebSocket handling, rendering functions


  🧠 What I Learned Building This

This wasn't my first API or JS project, but it was my first time working with:


🔌 WebSockets — subscribing to live data streams, handling open/message/close/error events, and reconnecting automatically when the connection drops

📊 Drawing an SVG graph by hand — converting raw numbers (exchange rates) into x, y pixel coordinates, building an SVG path string (M/L commands), and understanding how SVG's coordinate system flips the y-axis compared to a normal math graph (small y = top, large y = bottom!)

🔁 Keeping a live-updating UI in sync with streaming data without fully re-rendering the DOM every time (targeted setAttribute/textContent updates instead of innerHTML rebuilds)

