import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const RevenueChart = ({ labels = [], data = [] }) => {
  const chartData = {
    labels: labels.map((l) => new Date(l).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'Revenue',
        data,
        backgroundColor: '#22C55E',
        borderRadius: 4,
        maxBarThickness: 18,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `₹${ctx.parsed.y.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148,163,184,0.15)' },
        ticks: { font: { size: 11 }, callback: (v) => `₹${v}` },
      },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default RevenueChart;
