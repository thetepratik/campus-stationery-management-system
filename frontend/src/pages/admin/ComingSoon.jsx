import { FiTool } from 'react-icons/fi';

const ComingSoon = ({ title }) => (
  <div className="card empty-state" style={{ padding: 'var(--space-12)' }}>
    <FiTool size={32} color="var(--color-text-muted)" />
    <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>{title}</h2>
    <p>This module is built in an upcoming phase.</p>
  </div>
);

export default ComingSoon;
