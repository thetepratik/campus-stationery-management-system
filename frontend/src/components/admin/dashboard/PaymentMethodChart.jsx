import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#22C55E', '#4F46E5', '#0EA5E9', '#F59E0B', '#EF4444'];

const PaymentMethodChart = ({ labels = [], data = [] }) => {
  const displayLabels = labels.map((l) => l.toUpperCase());
  const chartData = {
    labels: displayLabels,
    datasets: [{ data, backgroundColor: COLORS, borderWidth: 0 }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 12 } },
    },
  };

  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div style={{ height: 240 }}>
      {total === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
          No offline sales recorded yet
        </div>
      ) : (
        <Pie data={chartData} options={options} />
      )}
    </div>
  );
};

export default PaymentMethodChart;
