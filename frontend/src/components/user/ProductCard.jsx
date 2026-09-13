import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import StarRating from "./StarRating";
import { formatCurrency } from "../../utils/formatCurrency";
import { useWishlist } from "../../context/WishlistContext";

const ProductCard = ({ product }) => {
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  const finalPrice =
    product.discountPercent > 0
      ? Math.round(
          (product.sellingPrice -
            (product.sellingPrice * product.discountPercent) / 100) *
            100,
        ) / 100
      : product.sellingPrice;

  const availabilityLabel =
    product.currentStock <= 0
      ? "Out of Stock"
      : product.currentStock <= (product.minStock || 10)
        ? "Low Stock"
        : null;

  return (
    <div
      className="card card--hoverable"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <button
        className="btn btn--icon"
        onClick={(e) => {
          e.preventDefault();
          toggle(product._id);
        }}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-sm)",
        }}
        aria-label="Toggle wishlist"
      >
        <FiHeart
          size={16}
          fill={wishlisted ? "var(--color-danger)" : "none"}
          color={wishlisted ? "var(--color-danger)" : "var(--color-text-muted)"}
        />
      </button>

      {product.discountPercent > 0 && (
        <span
          className="badge badge--outofstock"
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 2,
            background: "var(--color-danger)",
            color: "#fff",
          }}
        >
          {product.discountPercent}% OFF
        </span>
      )}

      <Link to={`/products/${product._id}`}>
        <div
          style={{
            aspectRatio: "1",
            background: "var(--color-bg)",
            overflow: "hidden",
          }}
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ height: "100%", color: "var(--color-text-muted)" }}
            >
              No image
            </div>
          )}
        </div>
        <div style={{ padding: "var(--space-4)" }}>
          <div
            style={{
              fontWeight: 500,
              fontSize: "var(--font-size-sm)",
              marginBottom: 4,
            }}
          >
            {product.name}
          </div>
          <StarRating
            rating={product.ratingAverage}
            count={product.ratingCount}
            size={12}
          />
          <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
            <span
              style={{ fontWeight: 700, fontSize: "var(--font-size-base)" }}
            >
              {formatCurrency(finalPrice)}
            </span>
            {product.discountPercent > 0 && (
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                  textDecoration: "line-through",
                }}
              >
                {formatCurrency(product.sellingPrice)}
              </span>
            )}
          </div>
          {availabilityLabel && (
            <span
              className={`badge ${availabilityLabel === "Out of Stock" ? "badge--outofstock" : "badge--lowstock"}`}
              style={{ marginTop: 6, display: "inline-block" }}
            >
              {availabilityLabel}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
