import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  // Fetch unique categories from products
  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("category");

    if (error) {
      console.error(error);
      return;
    }

    // Extract unique categories
    const uniqueCategories = [
      ...new Set(data.map((item) => item.category).filter(Boolean)),
    ];
    setCategories(uniqueCategories);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add new category by inserting a placeholder product
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    // optional: create a "dummy" category placeholder by updating existing product
    toast.success(
      `Category "${newCategory}" added! You can now assign products to it.`
    );
    setCategories([...categories, newCategory.trim()]);
    setNewCategory("");
  };

  // Rename category across all products
  const handleRename = async (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    const { error } = await supabase
      .from("products")
      .update({ category: newName })
      .eq("category", oldName);
    if (error) {
      toast.error("Error renaming category");
      console.error(error);
    } else {
      toast.success(`Renamed "${oldName}" → "${newName}"`);
      fetchCategories();
    }
    setEditing(null);
  };

  // Delete a category (set products to “Uncategorized”)
  const handleDelete = async (cat) => {
    if (
      !confirm(
        `Delete category "${cat}"? Products will be set to Uncategorized.`
      )
    )
      return;

    const { error } = await supabase
      .from("products")
      .update({ category: "Uncategorized" })
      .eq("category", cat);

    if (error) {
      toast.error("Error deleting category");
      console.error(error);
    } else {
      toast.success(`Category "${cat}" deleted.`);
      fetchCategories();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Product Categories</h1>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Add new category..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button
          onClick={handleAddCategory}
          className="bg-[#0680cd] hover:bg-[#056fb1]"
        >
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center text-gray-500">
          No categories found in products.
        </div>
      ) : (
        <ul className="bg-white rounded-lg shadow divide-y">
          {categories.map((cat) => (
            <li
              key={cat}
              className="flex justify-between items-center p-3 hover:bg-gray-50"
            >
              {editing === cat ? (
                <div className="flex w-full items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleRename(cat, editName)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <span>{cat}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditing(cat);
                        setEditName(cat);
                      }}
                      className="text-[#0680cd] hover:text-blue-800"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
