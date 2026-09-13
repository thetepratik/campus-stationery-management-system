import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import {
  FiHeart,
  FiShoppingCart,
  FiZap,
  FiMinus,
  FiPlus,
} from "react-icons/fi";

import { storeApi } from "../../services/storeApi";
import { reviewApi } from "../../services/reviewApi";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatCurrency";
import StarRating from "../../components/user/StarRating";
import ProductCard from "../../components/user/ProductCard";
import ReviewList from "../../components/user/ReviewList";
import ReviewForm from "../../components/user/ReviewForm";
import Button from "../../components/common/Button";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isWishlisted, toggle } = useWishlist();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await storeApi.getProduct(id);
      setProduct(res.data.product);
      setRelated(res.data.related);
      setActiveImage(0);
      setQuantity(1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await reviewApi.listForProduct(id);
      setReviews(res.data.reviews);
    } catch {
      // non-critical
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [fetchProduct, fetchReviews]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "var(--space-6)" }}>
        <div className="flex gap-6" style={{ flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 400px" }}>
            <Skeleton height={400} borderRadius={16} />
          </div>
          <div style={{ flex: "1 1 400px" }}>
            <Skeleton height={32} width={280} />
            <Skeleton height={20} width={140} style={{ marginTop: 8 }} />
            <Skeleton height={40} width={160} style={{ marginTop: 16 }} />
            <Skeleton height={100} style={{ marginTop: 16 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const finalPrice =
    product.discountPercent > 0
      ? Math.round(
          (product.sellingPrice -
            (product.sellingPrice * product.discountPercent) / 100) *
            100,
        ) / 100
      : product.sellingPrice;

  const wishlisted = isWishlisted(product._id);
  const outOfStock = product.currentStock <= 0;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addItem(product._id, quantity);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    const ok = await addItem(product._id, quantity);
    setAddingToCart(false);
    if (ok) navigate("/cart");
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)" }}>
      <div
        className="flex gap-6"
        style={{ flexWrap: "wrap", marginBottom: "var(--space-8)" }}
      >
        {/* ---------- Gallery ---------- */}
        <div style={{ flex: "1 1 400px", maxWidth: 460 }}>
          <div className="product-gallery-main">
            {product.images?.[activeImage] ? (
              <img
                src={product.images[activeImage]}
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
                No image available
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="product-gallery-thumbs">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className={`product-gallery-thumb ${i === activeImage ? "active" : ""}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Info ---------- */}
        <div style={{ flex: "1 1 400px" }}>
          <h1
            style={{
              fontSize: "var(--font-size-2xl)",
              marginBottom: "var(--space-2)",
            }}
          >
            {product.name}
          </h1>
          {product.brand && (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
                marginBottom: "var(--space-2)",
              }}
            >
              by {product.brand}
            </p>
          )}
          <StarRating
            rating={product.ratingAverage}
            count={product.ratingCount}
          />

          <div
            className="flex items-center gap-3"
            style={{ margin: "var(--space-4) 0" }}
          >
            <span style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700 }}>
              {formatCurrency(finalPrice)}
            </span>
            {product.discountPercent > 0 && (
              <>
                <span
                  style={{
                    fontSize: "var(--font-size-base)",
                    color: "var(--color-text-muted)",
                    textDecoration: "line-through",
                  }}
                >
                  {formatCurrency(product.sellingPrice)}
                </span>
                <span
                  className="badge badge--outofstock"
                  style={{ background: "var(--color-danger)", color: "#fff" }}
                >
                  {product.discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          <div style={{ marginBottom: "var(--space-5)" }}>
            {outOfStock ? (
              <span className="badge badge--outofstock">Out of Stock</span>
            ) : product.currentStock <= product.minStock ? (
              <span className="badge badge--lowstock">
                Only {product.currentStock} left in stock
              </span>
            ) : (
              <span className="badge badge--instock">In Stock</span>
            )}
          </div>

          {product.description && (
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-sm)",
                lineHeight: 1.7,
                marginBottom: "var(--space-5)",
              }}
            >
              {product.description}
            </p>
          )}

          {!outOfStock && (
            <div
              className="flex items-center gap-3"
              style={{ marginBottom: "var(--space-5)" }}
            >
              <span className="form-label" style={{ margin: 0 }}>
                Quantity
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn--outline btn--sm btn--icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <FiMinus size={12} />
                </button>
                <span
                  style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}
                >
                  {quantity}
                </span>
                <button
                  className="btn btn--outline btn--sm btn--icon"
                  onClick={() =>
                    setQuantity((q) => Math.min(product.currentStock, q + 1))
                  }
                >
                  <FiPlus size={12} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <Button
              variant="outline"
              size="lg"
              onClick={handleAddToCart}
              disabled={outOfStock}
              loading={addingToCart}
            >
              <FiShoppingCart size={16} /> Add to Cart
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleBuyNow}
              disabled={outOfStock}
              loading={addingToCart}
            >
              <FiZap size={16} /> Buy Now
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => toggle(product._id)}
            >
              <FiHeart
                size={16}
                fill={wishlisted ? "var(--color-danger)" : "none"}
                color={wishlisted ? "var(--color-danger)" : undefined}
              />
              {wishlisted ? "Wishlisted" : "Wishlist"}
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- Reviews ---------- */}
      <div className="card panel" style={{ marginBottom: "var(--space-8)" }}>
        <div className="panel__header">
          <span className="panel__title">Reviews & Ratings</span>
        </div>
        <ReviewForm
          productId={product._id}
          onSubmitted={() => {
            fetchReviews();
            fetchProduct();
          }}
        />
        {reviewsLoading ? (
          <Skeleton height={60} count={2} />
        ) : (
          <ReviewList reviews={reviews} />
        )}
      </div>

      {/* ---------- Related ---------- */}
      {related.length > 0 && (
        <div className="store-section">
          <div className="store-section__header">
            <span className="store-section__title">You Might Also Like</span>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
