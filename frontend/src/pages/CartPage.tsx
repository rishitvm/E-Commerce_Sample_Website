import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import toast from "react-hot-toast";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Cart</h2>
        <p className="text-slate-500 mb-4">Please login to view your cart</p>
        <Link
          to="/login"
          className="inline-block bg-amber-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors"
        >
          Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 mb-4">Add some products to get started!</p>
        <Link
          to="/"
          className="inline-block bg-amber-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    try {
      await updateQuantity(itemId, newQuantity);
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem(itemId);
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const imageUrl = item.product_image
              ? item.product_image.startsWith("http")
                ? item.product_image
                : `${API_URL}${item.product_image}`
              : null;

            return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex gap-4">
                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link
                    to={`/products/${item.product_id}`}
                    className="font-semibold text-slate-900 hover:text-amber-600"
                  >
                    {item.product_name}
                  </Link>
                  <p className="text-slate-600">${item.product_price.toFixed(2)}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border border-slate-300 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-1 font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">${item.subtotal.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-slate-600">
                <span>Items ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-amber-400 text-slate-900 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
