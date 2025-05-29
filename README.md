# QuantEdge

**QuantEdge** is a trading strategy simulation platform developed by students from **IIT Bombay** for our fintech startup.  
This web-based tool allows users to backtest custom long/short strategies on selected stocks and visualize performance through interactive financial charts.

---

##  Features

- Candlestick chart generation for selected stocks  
- Combined equity, position, and drawdown curve visualization  
-  Monthly PnL breakdown per stock  
-  Key performance metrics: Sharpe Ratio, Max Drawdown, Avg Return, etc.

---

##  How to Run the App Locally

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd quantedge

in terminal:

pip install flask pandas numpy matplotlib mplfinance plotly

python app.py

then click on the link http://127.0.0.1:5000/
