import { FiDollarSign, FiPackage, FiCheckCircle, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import StatCard from '../dashboard/StatCard';
import { formatCurrency } from '../../../utils/formatCurrency';

const InventoryValueCards = ({ report }) => {
  if (!report) return null;

  return (
    <div className="dashboard-stats-grid">
      <StatCard icon={FiDollarSign} label="Total Inventory Value" value={formatCurrency(report.totalValue)} color="primary" />
      <StatCard icon={FiPackage} label="Total Units in Stock" value={report.totalUnits.toLocaleString('en-IN')} color="secondary" />
      <StatCard icon={FiCheckCircle} label="Healthy Stock SKUs" value={report.health.inStockCount} color="secondary" />
      <StatCard icon={FiAlertTriangle} label="Low Stock SKUs" value={report.health.lowStockCount} color="warning" />
      <StatCard icon={FiXCircle} label="Out of Stock SKUs" value={report.health.outOfStockCount} color="danger" />
    </div>
  );
};

export default InventoryValueCards;
