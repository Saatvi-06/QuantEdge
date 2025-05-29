from flask import Flask, render_template, request, redirect
import csv
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Fix for threading issue (non-GUI backend)
import matplotlib.pyplot as plt
import mplfinance as mpf
import os
import numpy as np
import plotly.graph_objects as go

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        with open('users.csv', mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([email, password])
        return redirect('/trade')
    return render_template('login.html')

@app.route('/trade', methods=['GET', 'POST'])
def trade():
    if request.method == 'POST':
        data = [
            request.form.get('long_entry'),
            request.form.get('long_exit'),
            request.form.get('short_entry'),
            request.form.get('short_exit'),
            request.form.get('target'),
            request.form.get('asset'),
            request.form.get('commission'),
            request.form.get('initial_investment'),
            request.form.get('time_frame'),
            request.form.get('stock')
        ]
        with open('trade_inputs.csv', 'a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(data)
        return redirect('/trade')
    return render_template('trade.html')

@app.route('/results', methods=['POST'])
def results():
    selected_stocks = request.form.getlist('stocks')

    selected_stocks_str = ", ".join(selected_stocks)  # ✅ Convert list to string

    # Save strategy inputs to CSV
    with open('strategy_inputs.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        csv_file = 'strategy_inputs.csv'
        file_exists = os.path.isfile(csv_file)

        with open(csv_file, mode='a', newline='') as file:
           writer = csv.writer(file)
           writer.writerow([
            request.form.get('long_entry'),
            request.form.get('long_exit'),
            request.form.get('short_entry'),
            request.form.get('short_exit'),
            request.form.get('target'),
            request.form.get('asset'),
            request.form.get('commission'),
            request.form.get('initial_investment'),
            request.form.get('time_frame'),
            selected_stocks_str  # ✅ Now it’s a string, safe for CSV
        ])
           if not file_exists:
              writer.writerow(['Long Entry', 'Long Exit', 'Short Entry', 'Short Exit', 'Target',
                         'Asset', 'Commission', 'Initial Investment', 'Time Frame', 'Stocks'])

        
        

    print("Selected Stocks:", selected_stocks)

    

    time_frame = int(request.form.get('time_frame'))
    long_entry = float(request.form.get('long_entry'))
    long_exit = float(request.form.get('long_exit'))
    short_entry = float(request.form.get('short_entry'))
    short_exit = float(request.form.get('short_exit'))
    initial_investment = float(request.form.get('initial_investment'))
    commission = float(request.form.get('commission'))

    equity_plots = []
    performance_table = []
    monthly_table = []

    os.makedirs('static/plots', exist_ok=True)

    combined_equity_fig = go.Figure()
    combined_position_fig = go.Figure()
    combined_drawdown_fig = go.Figure()

    for stock in selected_stocks:
        df = pd.read_csv(f'data/{stock}.csv')
        df = df.rename(columns={
            'Open Price': 'Open', 'High Price': 'High',
            'Low Price': 'Low', 'Close Price': 'Close'
        })
        df['Date'] = pd.to_datetime(df['Date'])
        df.set_index('Date', inplace=True)
        df = df.sort_index().head(time_frame)

        metrics, monthly_returns, equity, position, drawdown, timestamps = simulate_stock(
            df, long_entry, long_exit, short_entry, short_exit, initial_investment, commission)

        # Save candlestick chart
        candle_path = f'static/plots/{stock.lower()}_candle.png'
        mpf.plot(df.head(30), type='candle', style='yahoo', savefig=candle_path)
        equity_plots.append({'stock': stock, 'path': candle_path})

        performance_table.append({'stock': stock, **metrics})
        monthly_table.append({'stock': stock, 'data': monthly_returns})

        # Add to combined plots
        combined_equity_fig.add_trace(go.Scatter(x=timestamps, y=equity, mode='lines', name=stock))
        combined_position_fig.add_trace(go.Scatter(x=timestamps, y=position, mode='lines', name=stock))
        combined_drawdown_fig.add_trace(go.Scatter(x=timestamps, y=drawdown, mode='lines', name=stock))

    # Save combined plotly charts
    combined_equity_fig.update_layout(title="Combined Equity Curve", xaxis_title="Date", yaxis_title="Equity")
    combined_position_fig.update_layout(title="Combined Position Curve", xaxis_title="Date", yaxis_title="Position")
    combined_drawdown_fig.update_layout(title="Combined Drawdown Curve", xaxis_title="Date", yaxis_title="Drawdown")

    combined_equity_fig.write_html('static/plots/equity_combined.html')
    combined_position_fig.write_html('static/plots/position_combined.html')
    combined_drawdown_fig.write_html('static/plots/drawdown_combined.html')

    return render_template("results.html",
                           equity_plots=equity_plots,
                           performance_table=performance_table,
                           monthly_table=monthly_table)

def simulate_stock(df, long_entry, long_exit, short_entry, short_exit, capital, commission):
    in_position = 0
    entry_price = 0
    equity = []
    drawdown = []
    position = []
    daily_returns = []
    peak = capital
    trades = []

    for i in range(len(df)):
        high = df.iloc[i]['High']
        low = df.iloc[i]['Low']
        close = df.iloc[i]['Close']
        date = df.index[i]

        if in_position == 0:
            if low <= long_entry:
                in_position = 1
                entry_price = long_entry
                capital -= commission
            elif high >= short_entry:
                in_position = -1
                entry_price = short_entry
                capital -= commission

        elif in_position == 1 and high >= long_exit:
            profit = (long_exit - entry_price) * (capital // entry_price)
            capital += profit - commission
            trades.append(profit)
            in_position = 0

        elif in_position == -1 and low <= short_exit:
            profit = (entry_price - short_exit) * (capital // entry_price)
            capital += profit - commission
            trades.append(profit)
            in_position = 0

        equity.append(capital)
        peak = max(peak, capital)
        drawdown.append(capital - peak)
        position.append(in_position)
        daily_returns.append(close)

    pnl = np.diff(equity)
    metrics = {
        'max_profit': round(max(pnl) if len(pnl) else 0, 2),
        'max_loss': round(min(pnl) if len(pnl) else 0, 2),
        'max_drawdown': round(min(drawdown), 2),
        'avg_return': round(np.mean(pnl) if len(pnl) else 0, 2),
        'sharpe_ratio': round(np.mean(pnl) / np.std(pnl), 2) if np.std(pnl) > 0 else 0,
        'avg_drawdown': round(np.mean(drawdown), 2)
    }

    # Resample with Month-End to fix the FutureWarning
    df_sim = pd.DataFrame({'Equity': equity}, index=df.index[:len(equity)])
    monthly_returns = df_sim['Equity'].resample('ME').last().pct_change().fillna(0).round(4).to_dict()

    return metrics, monthly_returns, equity, position, drawdown, df.index[:len(equity)]

if __name__ == '__main__':
    app.run(debug=True)
