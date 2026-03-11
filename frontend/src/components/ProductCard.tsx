import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { API_URL } from "../api/client";
import toast from "react-hot-toast";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }
    try {
      await addToCart(product.id);
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const imageUrl = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `${API_URL}${product.image_url}`
    : null;

  return (
    <Link to={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="aspect-square bg-slate-100 relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <ShoppingCart className="h-16 w-16" />
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 truncate group-hover:text-amber-600 transition-colors">
            {product.name}
          </h3>
          {product.category && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {product.category}
            </span>
          )}
          <div className="flex items-center mt-1">
            {product.average_rating ? (
              <>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(product.average_rating || 0)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 ml-1">({product.rating_count})</span>
              </>
            ) : (
              <span className="text-xs text-slate-400">No ratings yet</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</span>
            {product.stock > 0 && (
              <button
                onClick={handleAddToCart}
                className="bg-amber-400 text-slate-900 p-2 rounded-lg hover:bg-amber-300 transition-colors"
                title="Add to Cart"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
