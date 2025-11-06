import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { Plus, Pencil, Trash2, Loader2, ArrowUpDown } from "lucide-react";
import ProductForm from "../../components/admin/ProductForm";
import { toast } from "sonner";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Error fetching products");
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Error deleting product");
    else {
      toast.success("Product deleted");
      fetchProducts();
    }
  };

  // Filter + Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search)
      result = result.filter((p) => {
        const name = p.name?.toLowerCase() || "";
        const code = p.product_code?.toLowerCase() || "";
        return (
          name.includes(search.toLowerCase()) ||
          code.includes(search.toLowerCase())
        );
      });

    if (categoryFilter !== "All")
      result = result.filter((p) => p.category === categoryFilter);

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string")
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [products, search, categoryFilter, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const uniqueCategories = [
    "All",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

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
          className="flex items-center gap-2 bg-[#0680cd] text-white px-4 py-2 rounded-xl shadow-sm hover:bg-blue-700 transition active:scale-95"
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
      {loading ? (
        <div className="flex justify-center items-center text-gray-500 h-40">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
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
              {paginatedProducts.map((product) => (
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
                  <td className="px-4 py-3">${product.price}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">{product.sales_count}</td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                      className="text-[#0680cd] hover:text-blue-800 transition"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {paginatedProducts.length} of {filteredProducts.length}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
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
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <ProductForm
              onClose={() => setShowForm(false)}
              onSaved={fetchProducts}
              editingProduct={editingProduct}
            />
          </div>
        </div>
      )}
    </div>
  );
}
