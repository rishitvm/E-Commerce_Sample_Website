import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ShoppingCart, ArrowLeft, Minus, Plus } from "lucide-react";
import { getProduct, getProductRatings, rateProduct } from "../api/products";
import { Product, Rating } from "../types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { API_URL } from "../api/client";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [productData, ratingsData] = await Promise.all([
          getProduct(Number(id)),
          getProductRatings(Number(id)),
        ]);
        setProduct(productData);
        setRatings(ratingsData);
      } catch {
        toast.error("Product not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    try {
      await addToCart(product!.id, quantity);
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleSubmitRating = async () => {
    if (!user) {
      toast.error("Please login to rate products");
      return;
    }
    if (userRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmittingRating(true);
    try {
      await rateProduct(Number(id), userRating, userReview || undefined);
      toast.success("Rating submitted!");
      // Refresh data
      const [productData, ratingsData] = await Promise.all([
        getProduct(Number(id)),
        getProductRatings(Number(id)),
      ]);
      setProduct(productData);
      setRatings(ratingsData);
      setUserRating(0);
      setUserReview("");
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!product) return null;

  const imageUrl = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `${API_URL}${product.image_url}`
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-slate-100 rounded-xl overflow-hidden aspect-square">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <ShoppingCart className="h-24 w-24" />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
          {product.category && (
            <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm mb-4">
              {product.category}
            </span>
          )}

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(product.average_rating || 0)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-slate-600">
              {product.average_rating ? `${product.average_rating} / 5` : "No ratings"} ({product.rating_count} reviews)
            </span>
          </div>

          <p className="text-4xl font-bold text-slate-900 mb-6">${product.price.toFixed(2)}</p>

          {product.description && (
            <p className="text-slate-600 mb-6 leading-relaxed">{product.description}</p>
          )}

          <p className={`text-sm mb-6 ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-slate-300 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-slate-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-2 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-amber-400 text-slate-900 py-3 px-6 rounded-lg font-semibold hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rating Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Reviews</h2>

        {user && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h3 className="font-semibold text-slate-900 mb-4">Leave a Review</h3>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setUserRating(star)}>
                  <Star
                    className={`h-8 w-8 cursor-pointer transition-colors ${
                      star <= userRating ? "text-amber-400 fill-amber-400" : "text-slate-300 hover:text-amber-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              placeholder="Write your review (optional)..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
              rows={3}
            />
            <button
              onClick={handleSubmitRating}
              disabled={submittingRating || userRating === 0}
              className="bg-amber-400 text-slate-900 px-6 py-2 rounded-lg font-medium hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              {submittingRating ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}

        {ratings.length === 0 ? (
          <p className="text-slate-500">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= rating.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">
                    {rating.created_at ? new Date(rating.created_at).toLocaleDateString() : ""}
                  </span>
                </div>
                {rating.review && <p className="text-slate-600">{rating.review}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
