import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CustomerSpendingChart = ({ monthlySpending = [] }) => {
  if (!monthlySpending.length) {
    return (
      <div
        style={{
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        No spending data recorded
      </div>
    );
  }

  const labels = monthlySpending.map((m) => m.month);
  const dataValues = monthlySpending.map((m) => m.spent);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Monthly Spending',
        data: dataValues,
        backgroundColor: '#4F46E5', // Indigo
        borderRadius: 4,
        maxBarThickness: 28,
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
          label: (ctx) => `Spent: ₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#64748b' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: {
          font: { size: 11 },
          color: '#64748b',
          callback: (v) => `₹${v}`,
        },
      },
    },
  };

  return (
    <div style={{ height: 230, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default CustomerSpendingChart;
