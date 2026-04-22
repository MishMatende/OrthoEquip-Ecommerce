// src/components/admin/AdminCustomers.jsx

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  // 🔥 Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load customers");
      console.error(error);
    } else {
      setCustomers(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 🔥 Handle input
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 🔥 Open modal (create/edit)
  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setForm(customer);
    } else {
      setEditingCustomer(null);
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
      });
    }
    setShowModal(true);
  };

  // 🔥 Save (insert / update)
  const handleSave = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }

    if (editingCustomer) {
      // UPDATE
      const { error } = await supabase
        .from("customers")
        .update(form)
        .eq("id", editingCustomer.id);

      if (error) {
        toast.error("Failed to update");
        return;
      }

      toast.success("Customer updated");
    } else {
      // INSERT
      const { error } = await supabase.from("customers").insert([form]);

      if (error) {
        toast.error("Failed to create");
        return;
      }

      toast.success("Customer created");
    }

    setShowModal(false);
    fetchCustomers();
  };

  // 🔥 Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      toast.error("Delete failed");
      return;
    }

    toast.success("Customer deleted");
    fetchCustomers();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customers</h1>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-[#4eb0e3] text-white px-4 py-2 rounded-xl"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <p className="text-gray-500 text-center">No customers found.</p>
      ) : (
        <>
          {/* ✅ MOBILE */}
          <div className="space-y-4 md:hidden">
            {customers.map((c) => (
              <div
                key={c.id}
                className="bg-white border rounded-2xl p-4 shadow-sm space-y-2"
              >
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-gray-500">{c.email}</p>
                <p className="text-sm">{c.phone}</p>

                <div className="flex justify-end gap-3 mt-2">
                  <Pencil
                    className="text-blue-600 cursor-pointer"
                    onClick={() => openModal(c)}
                  />
                  <Trash2
                    className="text-red-600 cursor-pointer"
                    onClick={() => handleDelete(c.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ✅ DESKTOP */}
          <div className="hidden md:block bg-white border rounded-2xl overflow-hidden shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Address</th>
                  <th className="p-3 text-left">City</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3">{c.phone}</td>
                    <td className="p-3">{c.address}</td>
                    <td className="p-3">{c.city}</td>

                    <td className="p-3 text-right flex justify-end gap-3">
                      <Pencil
                        className="text-blue-600 cursor-pointer"
                        onClick={() => openModal(c)}
                      />
                      <Trash2
                        className="text-red-600 cursor-pointer"
                        onClick={() => handleDelete(c.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 🔥 MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {editingCustomer ? "Edit Customer" : "New Customer"}
            </h2>

            {["name", "email", "phone", "address", "city"].map((field) => (
              <input
                key={field}
                name={field}
                value={form[field] || ""}
                onChange={handleChange}
                placeholder={field.toUpperCase()}
                className="w-full border px-3 py-2 rounded-lg"
              />
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#4eb0e3] text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
