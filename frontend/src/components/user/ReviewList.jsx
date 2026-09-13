import StarRating from './StarRating';
import { formatDate } from '../../utils/formatDate';

const ReviewList = ({ reviews = [] }) => {
  if (!reviews.length) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
        No reviews yet. Be the first to share your thoughts!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {reviews.map((r) => (
        <div key={r._id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
          <div className="flex items-center justify-between">
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{r.student?.name || 'Student'}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{formatDate(r.createdAt)}</span>
          </div>
          <StarRating rating={r.rating} showCount={false} size={13} />
          {r.comment && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
              {r.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
