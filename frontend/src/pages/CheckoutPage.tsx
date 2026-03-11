import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { checkout } from "../api/orders";
import { CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!cart || cart.items.length === 0) {
    if (!orderPlaced) {
      navigate("/cart");
      return null;
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }
    setLoading(true);
    try {
      const order = await checkout(address);
      setOrderId(order.id);
      setOrderPlaced(true);
      await refreshCart();
      toast.success("Order placed successfully!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Order Confirmed!</h2>
        <p className="text-slate-600 mb-2">Your order #{orderId} has been placed successfully.</p>
        <p className="text-slate-500 mb-8">Thank you for shopping with ShopHub!</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/orders")}
            className="bg-amber-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors"
          >
            View Orders
          </button>
          <button
            onClick={() => navigate("/")}
            className="border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Shipping Address</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full shipping address..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              rows={4}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-slate-900 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              {loading ? "Placing Order..." : `Place Order - $${cart?.total.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Summary</h2>
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            {cart?.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.product_name} x {item.quantity}
                </span>
                <span className="font-medium">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${cart?.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
