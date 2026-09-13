import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, totalCount, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);

  const pageNumbers = [];
  const windowSize = 2;
  for (let p = Math.max(1, page - windowSize); p <= Math.min(totalPages, page + windowSize); p++) {
    pageNumbers.push(p);
  }

  return (
    <div className="flex items-center justify-between" style={{ padding: 'var(--space-4) 0', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        Showing {from}–{to} of {totalCount}
      </span>
      <div className="flex items-center gap-2">
        <button
          className="btn btn--outline btn--sm btn--icon"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} />
        </button>
        {pageNumbers[0] > 1 && <span style={{ color: 'var(--color-text-muted)' }}>...</span>}
        {pageNumbers.map((p) => (
          <button
            key={p}
            className={`btn btn--sm ${p === page ? 'btn--primary' : 'btn--outline'}`}
            style={{ minWidth: 36 }}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        {pageNumbers[pageNumbers.length - 1] < totalPages && <span style={{ color: 'var(--color-text-muted)' }}>...</span>}
        <button
          className="btn btn--outline btn--sm btn--icon"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
