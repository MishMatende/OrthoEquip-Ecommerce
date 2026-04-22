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
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const queryClient = useQueryClient();
  const debouncedSearch = useDebouncedValue(search, 400);

  const {
    data: resp = { data: [], total: 0 },
    isLoading,
    isError,
    error,
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

  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => p.category && cats.add(p.category));
    return ["All Categories", ...Array.from(cats)];
  }, [products]);

  const [deletingId, setDeletingId] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products-server"] });
    },
    onSettled: () => setDeletingId(null),
  });

  const handleDelete = (id) => {
    if (!window.confirm("Delete this product?")) return;
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortAsc((s) => !s);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Products
        </h1>

        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#4eb0e3] text-white px-4 py-2 rounded-xl shadow hover:bg-blue-600 transition"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-72 px-3 py-2 border rounded-xl"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-xl"
        >
          {uniqueCategories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* LOADING / ERROR */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-red-500">{error?.message}</p>
      ) : (
        <>
          {/* ✅ MOBILE CARDS */}
          <div className="space-y-4 md:hidden">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white border rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex gap-3">
                  <img
                    src={p.image_url}
                    className="w-14 h-14 rounded-xl object-cover border"
                  />

                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.product_code}</p>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span>{p.brand}</span>
                  <span className="font-semibold">KES {p.price}</span>
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Stock: {p.stock}</span>
                  <span>Sales: {p.sales_count}</span>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setShowForm(true);
                    }}
                    className="text-blue-600"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="text-red-600"
                  >
                    {deletingId === p.id ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto bg-white border rounded-2xl shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { name: "Image" },
                    { name: "Code", key: "product_code" },
                    { name: "Name", key: "name" },
                    { name: "Brand" },
                    { name: "Category" },
                    { name: "Price", key: "price" },
                    { name: "Stock" },
                    { name: "Sales" },
                    { name: "Actions" },
                  ].map((col) => (
                    <th
                      key={col.name}
                      onClick={() => col.key && handleSort(col.key)}
                      className="px-4 py-3 text-left cursor-pointer"
                    >
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <img
                        src={p.image_url}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="p-3">{p.product_code}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.brand}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3">KES {p.price}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3">{p.sales_count}</td>
                    <td className="p-3 flex gap-3">
                      <Pencil
                        className="cursor-pointer text-blue-600"
                        onClick={() => {
                          setEditingProduct(p);
                          setShowForm(true);
                        }}
                      />
                      <Trash2
                        className="cursor-pointer text-red-600"
                        onClick={() => handleDelete(p.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-500">
              Showing {products.length} of {total}
            </p>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded-lg"
              >
                Prev
              </button>

              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <ProductForm
              editingProduct={editingProduct}
              onClose={() => setShowForm(false)}
              onSaved={() => {
                queryClient.invalidateQueries({
                  queryKey: ["products-server"],
                });
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
