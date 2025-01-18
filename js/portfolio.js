export class Portfolio {
  constructor(initialCash) {
    this.cash = initialCash;
    this.holdings = new Map(); // symbol -> {quantity, avgPrice}
    this.history = [{
      timestamp: Date.now(),
      value: initialCash
    }];
  }

  get totalValue() {
    let holdingsValue = 0;
    for (const [symbol, holding] of this.holdings) {
      const currentPrice = window.latestPrices.get(symbol);
      holdingsValue += holding.quantity * currentPrice;
    }
    return this.cash + holdingsValue;
  }

  buyStock(symbol, quantity, price) {
    const cost = quantity * price;
    if (cost > this.cash) {
      throw new Error('Insufficient funds');
    }

    this.cash -= cost;
    if (this.holdings.has(symbol)) {
      const holding = this.holdings.get(symbol);
      const totalQuantity = holding.quantity + quantity;
      const totalCost = (holding.quantity * holding.avgPrice) + cost;
      holding.quantity = totalQuantity;
      holding.avgPrice = totalCost / totalQuantity;
    } else {
      this.holdings.set(symbol, {
        quantity,
        avgPrice: price
      });
    }

    this.updateHistory();
  }

  buyStockAmount(symbol, amount, price) {
    if (amount > this.cash) {
      throw new Error('Insufficient funds');
    }

    const quantity = amount / price;
    this.buyStock(symbol, quantity, price);
  }

  sellStock(symbol, quantity, price) {
    if (!this.holdings.has(symbol)) {
      throw new Error('Stock not owned');
    }

    const holding = this.holdings.get(symbol);
    if (holding.quantity < quantity) {
      throw new Error('Insufficient shares');
    }

    const proceeds = quantity * price;
    this.cash += proceeds;
    
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      this.holdings.delete(symbol);
    }

    this.updateHistory();
  }

  sellStockAmount(symbol, amount, price) {
    if (!this.holdings.has(symbol)) {
      throw new Error('Stock not owned');
    }

    const holding = this.holdings.get(symbol);
    const quantityToSell = amount / price;
    
    if (holding.quantity < quantityToSell) {
      throw new Error('Insufficient shares');
    }

    this.sellStock(symbol, quantityToSell, price);
  }

  updateHistory() {
    this.history.push({
      timestamp: Date.now(),
      value: this.totalValue
    });
  }

  getReturn() {
    const initial = this.history[0].value;
    const current = this.totalValue;
    return ((current - initial) / initial) * 100;
  }

  getDailyReturn() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const dayStart = this.history.find(h => h.timestamp >= oneDayAgo)?.value || this.history[0].value;
    return ((this.totalValue - dayStart) / dayStart) * 100;
  }
}