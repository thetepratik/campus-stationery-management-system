import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../common/Button';
import { reviewApi } from '../../services/reviewApi';

const ReviewForm = ({ productId, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      const res = await reviewApi.create(productId, rating, comment);
      toast.success(res.message);
      setRating(0);
      setComment('');
      onSubmitted();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-6)' }}>
      <div className="form-label" style={{ marginBottom: 'var(--space-2)' }}>Your Rating</div>
      <div className="flex" style={{ gap: 4, marginBottom: 'var(--space-3)' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <FiStar
                size={22}
                fill={value <= (hoverRating || rating) ? '#F59E0B' : 'none'}
                color={value <= (hoverRating || rating) ? '#F59E0B' : 'var(--color-border-strong)'}
              />
            </button>
          );
        })}
      </div>
      <textarea
        className="form-textarea"
        style={{ width: '100%', minHeight: 80, marginBottom: 'var(--space-3)' }}
        placeholder="Share your experience with this product (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
      />
      <Button type="submit" loading={submitting}>Submit Review</Button>
    </form>
  );
};

export default ReviewForm;
