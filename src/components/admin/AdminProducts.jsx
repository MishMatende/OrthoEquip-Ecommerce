// src/components/admin/AdminProducts.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { Plus, Pencil, Trash2, Loader2, ArrowUpDown } from "lucide-react";
import ProductForm from "../../components/admin/ProductForm";
import toast from "react-hot-toast";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useProductsServer } from "../../hooks/useProductsServer";

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminProducts() {
  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const queryClient = useQueryClient();

  // Debounced search so we don't refetch on every keystroke
  const debouncedSearch = useDebouncedValue(search, 400);

  const {
    data: resp = { data: [], total: 0 },
    isLoading,
    isError,
    error,
    isFetching,
  } = useProductsServer({
    page: currentPage,
    perPage,
    search: debouncedSearch,
    category: categoryFilter,
    sortField,
    sortAsc,
  });

  const products = resp.data || [];
  const total = resp.total || 0;

  // derive unique categories from a cached large list, or fallback to current page
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    try {
      const allCache = queryClient.getQueryData([
        "products",
        { perPage: 1000 },
      ]);
      if (Array.isArray(allCache)) {
        allCache.forEach((p) => p.category && cats.add(p.category));
      }
    } catch (e) {
      // ignore
    }
    products.forEach((p) => p.category && cats.add(p.category));
    return ["All Categories", ...Array.from(cats)];
  }, [products, queryClient]);

  // delete mutation (per-row loading handled by deletingId state)
  const [deletingId, setDeletingId] = useState(null);
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      toast.success("Product deleted", { position: "top-right" });
      queryClient.invalidateQueries({ queryKey: ["products-server"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      console.error("Delete error", err);
      toast.error("Error deleting product", { position: "top-right" });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDelete = (id) => {
    if (!window.confirm("Delete this product?")) return;
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) setSortAsc((s) => !s);
    else {
      setSortField(field);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
          Products
        </h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#4eb0e3] text-white px-4 py-2 rounded-xl shadow-sm hover:bg-blue-700 transition active:scale-95 cursor-pointer"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-blue-400"
        >
          {uniqueCategories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center text-gray-500 h-40">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading products...
        </div>
      ) : isError ? (
        <div className="text-center text-red-600 py-10">
          Failed to load products: {error?.message}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No matching products.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-100 bg-white/70 backdrop-blur-sm">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { name: "Image", key: "" },
                  { name: "Code", key: "product_code" },
                  { name: "Name", key: "name" },
                  { name: "Brand", key: "brand" },
                  { name: "Category", key: "category" },
                  { name: "Price", key: "price" },
                  { name: "Stock", key: "stock" },
                  { name: "Sales", key: "sales_count" },
                  { name: "Actions", key: "" },
                ].map(({ name, key }) => (
                  <th
                    key={name}
                    onClick={() => key && handleSort(key)}
                    className={`px-4 py-3 text-left font-medium uppercase tracking-wide text-gray-600 cursor-${
                      key ? "pointer" : "default"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {name}
                      {key === sortField && (
                        <ArrowUpDown
                          size={14}
                          className={`transition ${
                            sortAsc ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-blue-50/50 transition duration-150 ease-in-out"
                >
                  <td className="px-4 py-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{product.product_code}</td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">{product.brand}</td>
                  <td className="px-4 py-3">{product.category}</td>
                  <td className="px-4 py-3">KES {product.price}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">{product.sales_count}</td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                      className="text-[#4eb0e3] hover:text-blue-800 transition cursor-pointer"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800 transition flex items-center cursor-pointer"
                      disabled={deletingId === product.id}
                    >
                      {deletingId === product.id ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting
                        </span>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {products.length} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3 py-1 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ✕
            </button>
            <ProductForm
              onClose={() => setShowForm(false)}
              onSaved={() => {
                queryClient.invalidateQueries({
                  queryKey: ["products-server"],
                });
                setShowForm(false);
              }}
              editingProduct={editingProduct}
            />
          </div>
        </div>
      )}
    </div>
  );
}
