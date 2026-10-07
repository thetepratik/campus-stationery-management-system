import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiCheck } from 'react-icons/fi';
import StarRating from './StarRating';
import { formatCurrency } from '../../utils/formatCurrency';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../utils/imageUrl';

const ProductCard = ({ product }) => {
  const { isWishlisted, toggle } = useWishlist();
  const { addItem } = useCart();
  const wishlisted = isWishlisted(product._id);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const finalPrice =
    product.discountPercent > 0
      ? Math.round(
          (product.sellingPrice -
            (product.sellingPrice * product.discountPercent) / 100) *
            100
        ) / 100
      : product.sellingPrice;

  const isOutOfStock = product.currentStock <= 0;
  const isLowStock = !isOutOfStock && product.currentStock <= (product.minStock || 10);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || adding) return;
    setAdding(true);
    const ok = await addItem(product._id, 1);
    setAdding(false);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <div className="card card--hoverable modern-product-card">
      <button
        type="button"
        className="modern-product-card__wishlist"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(product._id);
        }}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <FiHeart
          size={16}
          fill={wishlisted ? 'var(--color-danger)' : 'none'}
          color={wishlisted ? 'var(--color-danger)' : 'var(--color-text-muted)'}
        />
      </button>

      {product.discountPercent > 0 && (
        <span className="modern-product-card__discount">
          {product.discountPercent}% OFF
        </span>
      )}

      <Link to={`/products/${product._id}`} className="modern-product-card__link">
        <div className="modern-product-card__image-wrap">
          {product.images?.[0] || product.imageUrl ? (
            <img
              src={getImageUrl(product.images?.[0] || product.imageUrl, product._id, 0)}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (import.meta.env.DEV) {
                  console.error('Product image failed to load:', e.currentTarget.src);
                }
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
              className="modern-product-card__img"
            />
          ) : null}
          <div
            className="modern-product-card__no-img"
            style={{ display: product.images?.[0] || product.imageUrl ? 'none' : 'flex' }}
          >
            <span>Stationery</span>
          </div>
        </div>

        <div className="modern-product-card__body">
          <div className="modern-product-card__title-wrap">
            <h3 className="modern-product-card__title" title={product.name}>
              {product.name}
            </h3>
            {product.brand && (
              <span className="modern-product-card__brand">{product.brand}</span>
            )}
          </div>

          <div className="modern-product-card__price-row">
            <span className="modern-product-card__price">
              {formatCurrency(finalPrice)}
            </span>
            {product.discountPercent > 0 && (
              <span className="modern-product-card__old-price">
                {formatCurrency(product.sellingPrice)}
              </span>
            )}
          </div>

          <div className="modern-product-card__footer">
            <div className="modern-product-card__stock">
              {isOutOfStock ? (
                <span className="stock-pill stock-pill--out">
                  <span className="stock-dot stock-dot--out" /> Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="stock-pill stock-pill--low">
                  <span className="stock-dot stock-dot--low" /> Low Stock
                </span>
              ) : (
                <span className="stock-pill stock-pill--in">
                  <span className="stock-dot stock-dot--in" /> In Stock
                </span>
              )}
            </div>

            <button
              type="button"
              className={`btn btn--sm modern-product-card__add-btn ${
                added ? 'modern-product-card__add-btn--added' : ''
              }`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              aria-label={`Add ${product.name} to cart`}
            >
              {added ? (
                <>
                  <FiCheck size={14} /> Added
                </>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : adding ? (
                'Adding...'
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default memo(ProductCard);
