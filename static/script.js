const n = 120,
    s = 2,
    pointStart = Date.UTC(2020, 0, 1),
    pointInterval = 24 * 36e5;

function getData(n) {
    const arr = [];
    let a = 0, b = 0, c = 0;

    for (let i = 0; i < n; i++) {
        if (i % 100 === 0) a = 2 * Math.random();
        if (i % 1000 === 0) b = 2 * Math.random();
        if (i % 10000 === 0) c = 2 * Math.random();

        arr.push([
            pointStart + i * pointInterval,
            2 * Math.sin(i / 100) + a + b + c + Math.random()
        ]);
    }

    return arr;
}

function getSeries(n, s) {
    const colors = ['#90ee90', '#ffff00']; // light green, yellow
    const r = [];
    for (let i = 0; i < s; i++) {
        r.push({
            name: `Stock ${i + 1}`,
            data: getData(n),
            color: colors[i], // <-- Set custom color
            dataGrouping: { enabled: false },
            lineWidth: 2,
            boostThreshold: 1,
            showInNavigator: true
        });
    }
    return r;
}

const series = getSeries(n, s);

// Add summed portfolio line
const summedData = series[0].data.map((point, i) => [
    point[0],
    point[1] + series[1].data[i][1]
]);

series.push({
    name: 'Portfolio',
    data: summedData,
    lineWidth: 2,
    color: 'red',
    showInNavigator: true,
    dataGrouping: { enabled: false },
    boostThreshold: 1
});

Highcharts.stockChart('container', {
    chart: {
        zooming: { type: 'x' },
        backgroundColor: '#000000'  // Black background
    },
    title: {
        text: 'Equity Curve',
        style: { color: '#ffffff' } // White title text
    },
    navigator: {
        xAxis: {
            ordinal: false,
            min: pointStart,
            max: pointStart + n * pointInterval,
            labels: { style: { color: '#ffffff' } },
            lineColor: '#ffffff'
        },
        yAxis: {
            min: 0,
            max: 10,
            labels: { style: { color: '#ffffff' } },
            gridLineColor: '#444444'
        },
        outlineColor: '#ffffff',
        maskFill: 'rgba(255, 255, 255, 0.1)'
    },
    scrollbar: {
        liveRedraw: false
    },
    legend: {
        enabled: false
    },
    xAxis: {
        min: pointStart,
        max: pointStart + n * pointInterval,
        ordinal: false,
        labels: { style: { color: '#ffffff' } },
        lineColor: '#ffffff',
        tickColor: '#ffffff'
    },
    yAxis: {
        min: 0,
        max: 20,
        labels: { style: { color: '#ffffff' } },
        title: { style: { color: '#ffffff' } },
        gridLineColor: '#444444'
    },
    tooltip: {
        valueDecimals: 2,
        split: false,
        backgroundColor: '#1a1a1a',
        style: { color: '#ffffff' }
    },
    series: series
});


// Compute drawdown
const portfolioValues = series[2].data;
let peak = portfolioValues[0][1];
const drawdownData = portfolioValues.map(([timestamp, value]) => {
    if (value > peak) peak = value;
    const drawdown = -(peak - value) / peak;
    return [timestamp, drawdown];
});

// Drawdown chart
// Drawdown chart
Highcharts.stockChart('drawdown-container', {
    chart: {
        zooming: { type: 'x' },
        backgroundColor: '#000000'
    },
    title: {
        text: 'Drawdown Curve',
        style: { color: '#ffffff' }
    },
    xAxis: {
        ordinal: false,
        type: 'datetime',
        labels: { style: { color: '#ffffff' } },
        lineColor: '#ffffff',
        tickColor: '#ffffff'
    },
    yAxis: {
        title: { text: 'Drawdown', style: { color: '#ffffff' } },
        min: -0.4,
        max: 0,
        labels: {
            style: { color: '#ffffff' },
            formatter: function () {
                return (this.value * 100).toFixed(0) + '%';
            }
        },
        gridLineColor: '#444444'
    },
    tooltip: {
        backgroundColor: '#1a1a1a',
        style: { color: '#ffffff' },
        formatter: function () {
            return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${(this.y * 100).toFixed(2)}%</b><br/>`;
        }
    },
    series: [{
        name: 'Drawdown',
        data: drawdownData,
        color: 'red',
        type: 'area',
        fillOpacity: 0.5,
        lineWidth: 2,
        dataGrouping: { enabled: false },
        showInNavigator: true,
        threshold: 0
    }]
});
Highcharts.chart('waterfall-container', {
    chart: {
        type: 'waterfall',
        backgroundColor: '#000000'
    },

    title: {
        text: 'Monthly PnL Waterfall',
        style: { color: '#ffffff' }
    },

    xAxis: {
        type: 'category',
        labels: {
            style: { color: '#ffffff' }
        }
    },

    yAxis: {
        title: {
            text: 'Rupees',
            style: { color: '#ffffff' }
        },
        labels: {
            style: { color: '#ffffff' }
        }
    },

    legend: {
        enabled: false
    },

    tooltip: {
        pointFormat: '<b>₹{point.y:,.2f}</b>',
        backgroundColor: '#1a1a1a',
        style: { color: '#ffffff' }
    },

    series: [{
        upColor: Highcharts.getOptions().colors[2],
        color: Highcharts.getOptions().colors[3],
        data: [
            { name: 'Start', y: 5000},
            { name: 'Jan', y: 1500 },
            { name: 'Feb', y: -950 },
            { name: 'Mar', y: 2500 },
            { name: 'Apr', y: -1200 },
            { name: 'May', y: 3000 },
            { name: 'Jun', y: -700 },
            { name: 'Jul', y: 5500 },
            { name: 'Aug', y: -1600 },
            { name: 'Sep', y: 4000 },
            { name: 'Oct', y: 5900 },
            { name: 'Nov', y: -2850 },
            { name: 'Dec', y: 6000 },
            { name: 'End', isSum: true, color: Highcharts.getOptions().colors[1] }
        ],
        dataLabels: {
            enabled: true,
            formatter: function () {
                return '₹' + this.y;
            },
            style: { color: '#ffffff' }
        },
        pointPadding: 0
    }]
});

// Monthly PnL data for performance metrics
const monthlyPnL = [
           { name: 'Jan', y: 1500 },
            { name: 'Feb', y: -950 },
            { name: 'Mar', y: 2500 },
            { name: 'Apr', y: -1200 },
            { name: 'May', y: 3000 },
            { name: 'Jun', y: -700 },
            { name: 'Jul', y: 5500 },
            { name: 'Aug', y: -1600 },
            { name: 'Sep', y: 4000 },
            { name: 'Oct', y: 5900 },
            { name: 'Nov', y: -2850 },
            { name: 'Dec', y: 6000 }
]

// Helper functions
const maxProfit = Math.max(...monthlyPnL.map(p => p.y));
const maxLoss = Math.min(...monthlyPnL.map(p => p.y));
const avgReturn = monthlyPnL.reduce((sum, p) => sum + p.y, 0) / monthlyPnL.length;

const drawdowns = drawdownData.map(d => d[1]);
const maxDrawdown = Math.max(...drawdowns);
const minDrawdown = Math.min(...drawdowns);
const avgDrawdown = drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length;

// Create and inject the metrics table
const metricsHTML = `
  <table style="color:white; margin: 20px auto; border-collapse: collapse; border: 1px solid #ccc; width: 90%; max-width: 700px; background-color: #111;">
    <caption style="font-size: 1.2em; padding: 10px; color: #fff;">Performance Metrics</caption>
    <thead>
      <tr style="background-color: #222;">
        <th style="padding: 10px; border: 1px solid #333;">Metric</th>
        <th style="padding: 10px; border: 1px solid #333;">Value</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding: 10px; border: 1px solid #333;">Max Profit</td><td style="padding: 10px; border: 1px solid #333;">${maxProfit}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #333;">Max Loss</td><td style="padding: 10px; border: 1px solid #333;">${maxLoss}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #333;">Average Return</td><td style="padding: 10px; border: 1px solid #333;">${avgReturn.toFixed(2)}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #333;">Max Drawdown</td><td style="padding: 10px; border: 1px solid #333;">${(maxDrawdown * 100).toFixed(2)}%</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #333;">Min Drawdown</td><td style="padding: 10px; border: 1px solid #333;">${(minDrawdown * 100).toFixed(2)}%</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #333;">Average Drawdown</td><td style="padding: 10px; border: 1px solid #333;">${(avgDrawdown * 100).toFixed(2)}%</td></tr>
    </tbody>
  </table>
`;

document.getElementById('performance-metrics').innerHTML = metricsHTML;

// Listen for window resize and force charts to resize/reflow
window.addEventListener('resize', () => {
  Highcharts.charts.forEach(chart => {
    if (chart) {
      chart.reflow();
    }
  });
});