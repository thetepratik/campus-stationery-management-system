import { FiStar } from 'react-icons/fi';

const StarRating = ({ rating = 0, count, size = 14, showCount = true }) => {
  return (
    <div className="flex items-center gap-1">
      <div className="flex" style={{ gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <FiStar
            key={i}
            size={size}
            fill={i < Math.round(rating) ? '#F59E0B' : 'none'}
            color={i < Math.round(rating) ? '#F59E0B' : 'var(--color-border-strong)'}
          />
        ))}
      </div>
      {showCount && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {rating > 0 ? rating.toFixed(1) : 'No ratings'} {count ? `(${count})` : ''}
        </span>
      )}
    </div>
  );
};

export default StarRating;
