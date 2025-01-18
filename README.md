# Investment Simulator

A realistic investment simulator that allows users to practice trading stocks in different risk categories with real-time price data.

## Features

- Real-time stock price updates using Finnhub API
- Three categories of stocks: Growth, Risky, and Stable
- Portfolio tracking and visualization
- Multiple currency support (USD, CAD)
- Customizable update frequency
- Interactive charts using Plotly
- Configurable initial capital

## Setup

1. Clone or download this repository
2. Get a Finnhub API key from https://finnhub.io/
3. Set up an HTTPS server either locally or with a service like Render
4. Copy this repository's files (according to the file structure below) into the server and open it at index.html
5. Enter your API key in the settings panel
6. Configure your initial capital and preferences
7. Start trading!

## File Structure
```
js
|-- app.js
|-- portfolio.js
|-- stockMarket.js
|-- uiController.js
styles.css
index.html
README.md
