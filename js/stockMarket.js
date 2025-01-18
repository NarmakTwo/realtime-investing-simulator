export class StockMarket {
  constructor() {
    this.stocks = {
      growth: [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { symbol: 'META', name: 'Meta Platforms Inc.' },
        { symbol: 'NFLX', name: 'Netflix Inc.' },
        { symbol: 'ADBE', name: 'Adobe Inc.' },
        { symbol: 'CRM', name: 'Salesforce Inc.' },
        { symbol: 'PYPL', name: 'PayPal Holdings' },
        { symbol: 'INTC', name: 'Intel Corporation' },
        { symbol: 'AMD', name: 'Advanced Micro Devices' },
        { symbol: 'NOW', name: 'ServiceNow Inc.' },
        { symbol: 'SNOW', name: 'Snowflake Inc.' },
        { symbol: 'UBER', name: 'Uber Technologies' },
        { symbol: 'SQ', name: 'Block Inc.' },
        { symbol: 'SHOP', name: 'Shopify Inc.' },
        { symbol: 'ABNB', name: 'Airbnb Inc.' },
        { symbol: 'DASH', name: 'DoorDash Inc.' },
        { symbol: 'NET', name: 'Cloudflare Inc.' }
      ],
      risky: [
        { symbol: 'TSLA', name: 'Tesla, Inc.' },
        { symbol: 'GME', name: 'GameStop Corp.' },
        { symbol: 'AMC', name: 'AMC Entertainment' },
        { symbol: 'COIN', name: 'Coinbase Global' },
        { symbol: 'PLTR', name: 'Palantir Technologies' },
        { symbol: 'NIO', name: 'NIO Inc.' },
        { symbol: 'RIVN', name: 'Rivian Automotive' },
        { symbol: 'LCID', name: 'Lucid Group' },
        { symbol: 'SPCE', name: 'Virgin Galactic' },
        { symbol: 'HOOD', name: 'Robinhood Markets' },
        { symbol: 'BYND', name: 'Beyond Meat' },
        { symbol: 'SNAP', name: 'Snap Inc.' },
        { symbol: 'DKNG', name: 'DraftKings Inc.' },
        { symbol: 'ROKU', name: 'Roku Inc.' },
        { symbol: 'RBLX', name: 'Roblox Corporation' },
        { symbol: 'MARA', name: 'Marathon Digital' },
        { symbol: 'RIOT', name: 'Riot Platforms' },
        { symbol: 'UPST', name: 'Upstart Holdings' },
        { symbol: 'FUBO', name: 'fuboTV Inc.' },
        { symbol: 'WISH', name: 'ContextLogic Inc.' }
      ],
      stable: [
        { symbol: 'JNJ', name: 'Johnson & Johnson' },
        { symbol: 'PG', name: 'Procter & Gamble' },
        { symbol: 'KO', name: 'Coca-Cola Company' },
        { symbol: 'WMT', name: 'Walmart Inc.' },
        { symbol: 'MCD', name: 'McDonald\'s Corporation' },
        { symbol: 'PEP', name: 'PepsiCo Inc.' },
        { symbol: 'COST', name: 'Costco Wholesale' },
        { symbol: 'UNH', name: 'UnitedHealth Group' },
        { symbol: 'VZ', name: 'Verizon Communications' },
        { symbol: 'T', name: 'AT&T Inc.' },
        { symbol: 'HD', name: 'Home Depot' },
        { symbol: 'DIS', name: 'Walt Disney Co.' },
        { symbol: 'NKE', name: 'Nike Inc.' },
        { symbol: 'MA', name: 'Mastercard Inc.' },
        { symbol: 'V', name: 'Visa Inc.' },
        { symbol: 'CVX', name: 'Chevron Corporation' },
        { symbol: 'XOM', name: 'Exxon Mobil' },
        { symbol: 'BAC', name: 'Bank of America' },
        { symbol: 'JPM', name: 'JPMorgan Chase' },
        { symbol: 'CSCO', name: 'Cisco Systems' }
      ]
    };

    this.socket = null;
    this.apiKey = localStorage.getItem('finnhub-api-key') || '';
    this.testRequestInProgress = false;
    
    if (!window.latestPrices) {
      window.latestPrices = new Map();
    }
  }

  initializeWebSocket() {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        console.warn('Error closing existing socket:', e);
      }
    }

    try {
      this.socket = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

      this.socket.addEventListener('open', () => {
        console.log('WebSocket connected');
        // Subscribe to all stocks
        this.getAllStocks().forEach(stock => {
          this.socket.send(JSON.stringify({
            type: 'subscribe',
            symbol: stock.symbol
          }));
        });
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'trade') {
            data.data.forEach(trade => {
              window.latestPrices.set(trade.s, trade.p);
            });
          }
        } catch (e) {
          console.error('Error processing message:', e);
        }
      });

      this.socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.socket.addEventListener('close', () => {
        console.log('WebSocket closed');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      });
    } catch (e) {
      console.error('Error initializing WebSocket:', e);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.initializeWebSocket(), 5000);
    }
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('finnhub-api-key', key);
    this.initializeWebSocket();
  }

  unsubscribeAll() {
    if (this.socket) {
      this.getAllStocks().forEach(stock => {
        this.socket.send(JSON.stringify({
          type: 'unsubscribe',
          symbol: stock.symbol
        }));
      });
    }
  }

  async fetchPrices() {
    const allSymbols = [...this.stocks.growth, ...this.stocks.risky, ...this.stocks.stable]
      .map(stock => stock.symbol);
    
    try {
      // For development/demo, always use mock data to avoid API issues
      allSymbols.forEach(symbol => {
        const currentPrice = window.latestPrices.get(symbol);
        let basePrice;
        
        if (currentPrice) {
          // If we already have a price, fluctuate it slightly
          const change = (Math.random() - 0.5) * 10; // +/- $5
          basePrice = currentPrice + change;
        } else {
          // Initial price if none exists
          basePrice = 100 + Math.random() * 900;
        }
        
        window.latestPrices.set(symbol, basePrice);
      });
      
      return Array.from(window.latestPrices.entries()).map(([symbol, price]) => ({
        symbol,
        price
      }));
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      return [];
    }
  }

  getStocksByCategory(category) {
    return this.stocks[category] || [];
  }

  getAllStocks() {
    return [
      ...this.stocks.growth,
      ...this.stocks.risky,
      ...this.stocks.stable
    ];
  }

  async testApiKey(key) {
    if (this.testRequestInProgress) {
      throw new Error('A test is already in progress');
    }

    this.testRequestInProgress = true;
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`);
      const data = await response.json();
      
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return true;
    } catch (error) {
      throw error;
    } finally {
      this.testRequestInProgress = false;
    }
  }
}