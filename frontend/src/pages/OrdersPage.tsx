import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Clock } from "lucide-react";
import { getMyOrders } from "../api/orders";
import { Order } from "../types";
import { useAuth } from "../context/AuthContext";

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchOrders = async () => {
      try {
        const data = await getMyOrders();
        setOrders(data.orders);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, navigate]);

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-700";
      case "shipped": return "bg-blue-100 text-blue-700";
      case "delivered": return "bg-purple-100 text-purple-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Orders Yet</h2>
          <p className="text-slate-500">Start shopping to see your orders here!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-900">Order #{order.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="h-4 w-4" />
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : ""}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-slate-600">
                      <span>
                        {item.product_name || `Product #${item.product_id}`} x {item.quantity}
                      </span>
                      <span>${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  {order.shipping_address && (
                    <p className="text-sm text-slate-500">
                      Ship to: {order.shipping_address}
                    </p>
                  )}
                  <p className="font-bold text-lg text-slate-900 ml-auto">
                    Total: ${order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
