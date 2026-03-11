import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Package, ShoppingCart, Image, X } from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from "../api/products";
import { getAllOrders } from "../api/orders";
import { Product, Order } from "../types";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api/client";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "products") {
        const data = await getProducts(1, 100);
        setProducts(data.products);
      } else {
        const data = await getAllOrders();
        setOrders(data.orders);
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory("");
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategory(product.category || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Name and price are required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name,
          description: description || undefined,
          price: parseFloat(price),
          stock: parseInt(stock) || 0,
          category: category || undefined,
        });
        toast.success("Product updated!");
      } else {
        await createProduct({
          name,
          description: description || undefined,
          price: parseFloat(price),
          stock: parseInt(stock) || 0,
          category: category || undefined,
        });
        toast.success("Product created!");
      }
      resetForm();
      fetchData();
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted!");
      fetchData();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleImageUpload = async (productId: number, file: File) => {
    try {
      await uploadProductImage(productId, file);
      toast.success("Image uploaded!");
      fetchData();
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-700";
      case "shipped": return "bg-blue-100 text-blue-700";
      case "delivered": return "bg-purple-100 text-purple-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  if (!user?.is_admin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === "products"
              ? "text-amber-600 border-b-2 border-amber-400"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Products
          </div>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === "orders"
              ? "text-amber-600 border-b-2 border-amber-400"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders
          </div>
        </button>
      </div>

      {activeTab === "products" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Products ({products.length})
            </h2>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-amber-300 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" /> Add Product
            </button>
          </div>

          {/* Product Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingProduct ? "Edit Product" : "Add Product"}
                  </h3>
                  <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Price *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-amber-400 text-slate-900 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => {
                    const imageUrl = product.image_url
                      ? product.image_url.startsWith("http")
                        ? product.image_url
                        : `${API_URL}${product.image_url}`
                      : null;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden relative group">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ShoppingCart className="h-5 w-5" />
                              </div>
                            )}
                            <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                              <Image className="h-4 w-4 text-white" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(product.id, file);
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                        <td className="px-6 py-4 text-slate-600">${product.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{product.category || "-"}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="text-center py-10 text-slate-500">No products yet</div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "orders" && (
        <>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            All Orders ({orders.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No orders yet</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">Order #{order.id}</h3>
                      <span className="text-sm text-slate-500">User #{order.user_id}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-slate-600">
                        <span>{item.product_name || `Product #${item.product_id}`} x {item.quantity}</span>
                        <span>${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    {order.shipping_address && (
                      <p className="text-sm text-slate-500">Ship to: {order.shipping_address}</p>
                    )}
                    <p className="font-bold text-slate-900 ml-auto">${order.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
