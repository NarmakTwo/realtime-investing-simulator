import { Portfolio } from './portfolio.js';
import { StockMarket } from './stockMarket.js';
import { UIController } from './uiController.js';

const portfolio = new Portfolio(10000); // Start with $10,000
const stockMarket = new StockMarket();
const ui = new UIController(portfolio, stockMarket);

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
  ui.initialize();
});