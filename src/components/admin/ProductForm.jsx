import { useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function ProductForm({ onClose, onSaved, editingProduct }) {
  const isEditing = Boolean(editingProduct);

  const [formData, setFormData] = useState({
    product_code: editingProduct?.product_code || "",
    name: editingProduct?.name || "",
    description: editingProduct?.description || "",
    category: editingProduct?.category || "",
    brand: editingProduct?.brand || "",
    price: editingProduct?.price || "",
    stock: editingProduct?.stock || "",
    image_url: editingProduct?.image_url || "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // 🖼️ Handle image upload to Supabase Storage
  const uploadImage = async () => {
    if (!imageFile) return formData.image_url; // keep existing image

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const image_url = await uploadImage();
      const payload = {
        ...formData,
        image_url,
        price: Number(formData.price),
        stock: Number(formData.stock),
        updated_at: new Date(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
      }

      onSaved(); // refresh table
      onClose(); // close modal
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product", {
        position: "top-right",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product Code</Label>
              <Input
                name="product_code"
                value={formData.product_code}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Brand</Label>
              <Input
                name="brand"
                value={formData.brand}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price</Label>
              <Input
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded-md p-2 text-sm"
              rows="3"
            />
          </div>

          <div>
            <Label>Product Image</Label>
            <div className="flex items-center gap-3 mt-1">
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
                <Upload size={16} />
                <span>Select Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {imageFile ? (
                <span className="text-sm text-gray-600">{imageFile.name}</span>
              ) : (
                formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="preview"
                    className="w-12 h-12 rounded object-cover"
                  />
                )
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0680cd] hover:bg-[#056fb1]"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
