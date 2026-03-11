import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { getProducts, getCategories } from "../api/products";
import { Product } from "../types";
import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const search = searchParams.get("search") || "";

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getProducts(page, 12, search || undefined, selectedCategory || undefined);
        setProducts(data.products);
        setTotalPages(data.total_pages);
        setTotal(data.total);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, search, selectedCategory]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero section */}
      {!search && !selectedCategory && page === 1 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 md:p-12 mb-8 text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Welcome to ShopHub</h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Discover amazing products at great prices. Shop now and get free shipping on orders over $50!
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="h-5 w-5" />
          <span className="font-medium">Filters:</span>
        </div>
        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
        {(search || selectedCategory) && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-500 hover:text-red-600 underline"
          >
            Clear Filters
          </button>
        )}
        <span className="text-sm text-slate-500 ml-auto">
          {total} product{total !== 1 ? "s" : ""} found
        </span>
      </div>

      {search && (
        <p className="text-slate-600 mb-4">
          Search results for: <span className="font-semibold">&quot;{search}&quot;</span>
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-slate-500">No products found</p>
          {(search || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-amber-600 hover:text-amber-500 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
