import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, Package, Shield, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-amber-400" />
            <span className="text-xl font-bold text-amber-400">ShopHub</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
          </form>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.is_admin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    <Shield className="h-5 w-5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <Link
                  to="/orders"
                  className="flex items-center space-x-1 text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Package className="h-5 w-5" />
                  <span className="hidden sm:inline">Orders</span>
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center space-x-1 text-slate-300 hover:text-amber-400 transition-colors relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center space-x-2 text-slate-300">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-amber-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-amber-300 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
