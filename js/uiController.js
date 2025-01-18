import { Portfolio } from './portfolio.js';

export class UIController {
  constructor(portfolio, stockMarket) {
    this.portfolio = portfolio;
    this.stockMarket = stockMarket;
    this.updateInterval = null;
    this.currentCurrency = localStorage.getItem('display-currency') || 'USD';
    this.updateFrequency = parseInt(localStorage.getItem('update-frequency') || '1', 10);
    this.exchangeRates = {
      USD: 1,
      CAD: 1.35
    };

    this.setupSettings();
    this.fetchExchangeRates();
  }

  async fetchExchangeRates() {
    try {
      // In a real app, you'd fetch from an API like:
      // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      // const data = await response.json();
      // this.exchangeRates = data.rates;
      
      // For demo, using static rates
      this.exchangeRates = {
        USD: 1,
        CAD: 1.35
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  }

  convertCurrency(amount) {
    return amount * this.exchangeRates[this.currentCurrency];
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.currentCurrency
    }).format(this.convertCurrency(amount));
  }

  setupSettings() {
    const savedApiKey = localStorage.getItem('finnhub-api-key');
    const savedInitialCapital = localStorage.getItem('initial-capital');
    const savedCurrency = localStorage.getItem('display-currency');
    const savedFrequency = localStorage.getItem('update-frequency');

    if (savedApiKey) {
      document.getElementById('api-key').value = savedApiKey;
    }
    if (savedInitialCapital) {
      document.getElementById('initial-capital').value = savedInitialCapital;
    }
    if (savedCurrency) {
      document.getElementById('currency-select').value = savedCurrency;
      this.currentCurrency = savedCurrency;
    }
    if (savedFrequency) {
      document.getElementById('update-frequency').value = savedFrequency;
      this.updateFrequency = parseInt(savedFrequency, 10);
    }

    document.getElementById('save-settings').addEventListener('click', () => {
      const apiKey = document.getElementById('api-key').value;
      const initialCapital = parseFloat(document.getElementById('initial-capital').value);
      const currency = document.getElementById('currency-select').value;
      const frequency = parseInt(document.getElementById('update-frequency').value, 10);

      if (frequency < 1 || frequency > 60) {
        alert('Please enter a frequency between 1 and 60 minutes');
        return;
      }

      localStorage.setItem('finnhub-api-key', apiKey);
      localStorage.setItem('initial-capital', initialCapital);
      localStorage.setItem('display-currency', currency);
      localStorage.setItem('update-frequency', frequency);

      this.currentCurrency = currency;
      this.updateFrequency = frequency;
      this.stockMarket.setApiKey(apiKey);
      this.portfolio = new Portfolio(initialCapital);
      
      // Restart the update interval with new frequency
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      this.startPriceUpdates();
      
      this.updateUI();
    });

    document.getElementById('currency-select').addEventListener('change', (e) => {
      this.currentCurrency = e.target.value;
      localStorage.setItem('display-currency', e.target.value);
      this.updateUI();
    });

    // Add API key test button handler
    document.getElementById('test-api-key').addEventListener('click', async () => {
      const button = document.getElementById('test-api-key');
      const apiKey = document.getElementById('api-key').value.trim();
      
      if (!apiKey) {
        alert('Please enter an API key first');
        return;
      }

      button.disabled = true;
      button.textContent = 'Testing...';
      
      try {
        await this.stockMarket.testApiKey(apiKey);
        alert('API key is valid!');
      } catch (error) {
        alert(`API key test failed: ${error.message}`);
      } finally {
        button.disabled = false;
        button.textContent = 'Test API Key';
      }
    });
  }

  initialize() {
    this.setupEventListeners();
    this.initializeStockLists();
    this.startPriceUpdates();
    this.updateUI();
  }

  setupEventListeners() {
    document.getElementById('buy-btn').addEventListener('click', () => this.handleTrade('buy'));
    document.getElementById('sell-btn').addEventListener('click', () => this.handleTrade('sell'));

    document.getElementById('trade-type').addEventListener('change', (e) => {
      const sharesInput = document.getElementById('shares-input');
      const amountInput = document.getElementById('amount-input');
      
      if (e.target.value === 'shares') {
        sharesInput.style.display = 'block';
        amountInput.style.display = 'none';
      } else {
        sharesInput.style.display = 'none';
        amountInput.style.display = 'block';
      }
    });
  }

  async initializeStockLists() {
    await this.stockMarket.fetchPrices();
    
    if (!window.latestPrices) {
      console.error('Latest prices not available');
      return;
    }
    
    ['growth', 'risky', 'stable'].forEach(category => {
      const stocks = this.stockMarket.getStocksByCategory(category);
      const container = document.getElementById(`${category}-stocks`);
      const select = document.getElementById('stock-select');
      
      if (!container || !select) {
        console.error(`Container or select not found for ${category}`);
        return;
      }
      
      stocks.forEach(stock => {
        const price = window.latestPrices.get(stock.symbol) || 0;
        
        const stockElement = document.createElement('div');
        stockElement.className = 'stock-item';
        stockElement.innerHTML = `
          <span>${stock.symbol} - ${stock.name}</span>
          <span class="price" data-symbol="${stock.symbol}">${this.formatCurrency(price)}</span>
        `;
        container.appendChild(stockElement);

        const option = document.createElement('option');
        option.value = stock.symbol;
        option.textContent = `${stock.symbol} - ${stock.name}`;
        select.appendChild(option);
      });
    });
  }

  startPriceUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Convert minutes to milliseconds
    const intervalMs = this.updateFrequency * 60 * 1000;
    
    this.updateInterval = setInterval(async () => {
      await this.stockMarket.fetchPrices();
      this.updatePrices();
      this.updateUI();
    }, intervalMs);
    
    // Initial update
    this.stockMarket.fetchPrices().then(() => {
      this.updatePrices();
      this.updateUI();
    });
  }

  updateUI() {
    document.getElementById('total-value').textContent = this.formatCurrency(this.portfolio.totalValue);
    document.getElementById('cash-balance').textContent = this.formatCurrency(this.portfolio.cash);
    document.getElementById('daily-change').textContent = `${this.portfolio.getDailyReturn().toFixed(2)}%`;
    document.getElementById('total-return').textContent = `${this.portfolio.getReturn().toFixed(2)}%`;

    const holdingsList = document.getElementById('holdings-list');
    holdingsList.innerHTML = '';
    
    for (const [symbol, holding] of this.portfolio.holdings) {
      const currentPrice = window.latestPrices.get(symbol);
      const value = holding.quantity * currentPrice;
      const gainLoss = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
      
      const holdingElement = document.createElement('div');
      holdingElement.className = 'holding-item';
      holdingElement.innerHTML = `
        <span>${symbol}</span>
        <span>${holding.quantity.toFixed(4)} shares</span>
        <span>${this.formatCurrency(currentPrice)}</span>
        <span>${this.formatCurrency(value)}</span>
        <span class="${gainLoss >= 0 ? 'price-up' : 'price-down'}">
          ${gainLoss.toFixed(2)}%
        </span>
      `;
      holdingsList.appendChild(holdingElement);
    }

    this.updatePrices();
    this.updateCharts();
  }

  updatePrices() {
    const priceElements = document.querySelectorAll('.price');
    priceElements.forEach(element => {
      const symbol = element.dataset.symbol;
      const newPrice = window.latestPrices.get(symbol);
      const oldPrice = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) / this.exchangeRates[this.currentCurrency];
      
      element.textContent = this.formatCurrency(newPrice);
      element.className = `price ${newPrice > oldPrice ? 'price-up' : 'price-down'}`;
    });
  }

  updateCharts() {
    const trace1 = {
      x: this.portfolio.history.map(h => new Date(h.timestamp)),
      y: this.portfolio.history.map(h => this.convertCurrency(h.value)),
      type: 'scatter',
      name: 'Portfolio Value'
    };

    Plotly.newPlot('portfolio-chart', [trace1], {
      title: 'Portfolio Value Over Time',
      xaxis: { title: 'Time' },
      yaxis: { 
        title: `Value (${this.currentCurrency})`,
        tickformat: ',.2f'
      }
    });

    const holdings = Array.from(this.portfolio.holdings.entries());
    const values = holdings.map(([symbol, holding]) => 
      this.convertCurrency(holding.quantity * window.latestPrices.get(symbol))
    );
    values.push(this.convertCurrency(this.portfolio.cash));

    const labels = holdings.map(([symbol]) => symbol);
    labels.push('Cash');

    const trace2 = {
      values,
      labels,
      type: 'pie',
      name: 'Portfolio Allocation'
    };

    Plotly.newPlot('allocation-chart', [trace2], {
      title: 'Portfolio Allocation'
    });
  }

  async handleTrade(type) {
    const symbol = document.getElementById('stock-select').value;
    const tradeType = document.getElementById('trade-type').value;
    const price = window.latestPrices.get(symbol);

    try {
      if (tradeType === 'shares') {
        const quantity = parseFloat(document.getElementById('quantity').value);
        if (!quantity || quantity <= 0) {
          throw new Error('Please enter a valid quantity');
        }

        if (type === 'buy') {
          this.portfolio.buyStock(symbol, quantity, price);
        } else {
          this.portfolio.sellStock(symbol, quantity, price);
        }
      } else {
        const amount = parseFloat(document.getElementById('amount').value);
        if (!amount || amount <= 0) {
          throw new Error('Please enter a valid amount');
        }

        if (type === 'buy') {
          this.portfolio.buyStockAmount(symbol, amount, price);
        } else {
          this.portfolio.sellStockAmount(symbol, amount, price);
        }
      }
      
      this.updateUI();
    } catch (error) {
      alert(error.message);
    }
  }
}