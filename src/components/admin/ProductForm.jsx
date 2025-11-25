// src/components/admin/ProductForm.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";

/**
 * ProductForm with added console.log traces for troubleshooting slow uploads/saves.
 * Developer preview path points to the uploaded file so preview shows during dev.
 *
 * DEV PREVIEW PATH:
 * /mnt/data/3492e6e9-4365-461d-bd5a-dda0ebd9e7e8.png
 */

const DEV_PREVIEW_PATH = "/mnt/data/3492e6e9-4365-461d-bd5a-dda0ebd9e7e8.png";

export default function ProductForm({ onClose, onSaved, editingProduct }) {
  const queryClient = useQueryClient();

  // form fields
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState(0);
  const [description, setDescription] = useState("");

  // file + preview states
  const [file, setFile] = useState(null); // File object
  const [preview, setPreview] = useState(null); // object URL or uploaded path/url
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setProductCode(editingProduct.product_code || "");
      setName(editingProduct.name || "");
      setPrice(editingProduct.price ?? "");
      setImageUrl(editingProduct.image_url || "");
      setCategory(editingProduct.category || "");
      setBrand(editingProduct.brand || "");
      setStock(editingProduct.stock ?? 0);
      setDescription(editingProduct.description || "");
      setFile(null);
      setPreview(editingProduct.image_url || null);
    } else {
      setProductCode("");
      setName("");
      setPrice("");
      setImageUrl("");
      setCategory("");
      setBrand("");
      setStock(0);
      setDescription("");
      setFile(null);
      // dev preview path to help layout testing
      setPreview(DEV_PREVIEW_PATH);
    }
  }, [editingProduct]);

  // when file selected, create object URL for preview
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // upload helper — uploads file to bucket and returns public URL + path
  async function uploadFileToStorage(file) {
    if (!file) {
      console.log(
        "[ProductForm] uploadFileToStorage called with no file -> returning null"
      );
      return null;
    }
    setUploading(true);

    const start = Date.now();
    console.log("[ProductForm] uploadFileToStorage START", {
      name: file.name,
      size: file.size,
      type: file.type,
      time: new Date(start).toISOString(),
    });

    try {
      const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const filePath = `products/${filename}`;

      const uploadStart = Date.now();
      console.log("[ProductForm] calling supabase.storage.upload", {
        filePath,
        uploadStart: new Date(uploadStart).toISOString(),
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      const uploadEnd = Date.now();
      console.log("[ProductForm] upload result", {
        uploadData,
        uploadError,
        durationMs: uploadEnd - uploadStart,
      });

      if (uploadError) {
        console.error("[ProductForm] Upload error", uploadError);
        setUploading(false);
        throw uploadError;
      }

      const publicUrlStart = Date.now();
      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);
      const publicUrlEnd = Date.now();

      console.log("[ProductForm] getPublicUrl result", {
        publicUrlData,
        publicUrlError,
        durationMs: publicUrlEnd - publicUrlStart,
      });

      if (publicUrlError) {
        console.error("[ProductForm] getPublicUrl error", publicUrlError);
        setUploading(false);
        throw publicUrlError;
      }

      setUploading(false);
      const end = Date.now();
      console.log("[ProductForm] uploadFileToStorage END", {
        totalDurationMs: end - start,
        time: new Date(end).toISOString(),
      });

      return { publicUrl: publicUrlData.publicUrl, path: uploadData.path };
    } catch (err) {
      setUploading(false);
      console.error("[ProductForm] uploadFileToStorage error:", err);
      throw err;
    }
  }

  // create or update mutation
  const upsertMutation = useMutation({
    mutationFn: async (payload) => {
      const mutationStart = Date.now();
      console.log("[ProductForm] mutationFn START", {
        payloadSummary: {
          id: payload.id,
          name: payload.name,
          hasImageUrl: !!payload.image_url,
        },
        time: new Date(mutationStart).toISOString(),
      });

      const {
        id,
        product_code,
        name,
        price,
        image_url,
        category,
        brand,
        stock,
        description,
      } = payload;

      if (id) {
        const { error } = await supabase
          .from("products")
          .update({
            product_code,
            name,
            price,
            image_url,
            category,
            brand,
            stock,
            description,
          })
          .eq("id", id);

        const mutationEnd = Date.now();
        console.log("[ProductForm] update finished", {
          mutationDurationMs: mutationEnd - mutationStart,
          error,
        });
        if (error) throw error;
        return { id };
      } else {
        const { data, error } = await supabase.from("products").insert([
          {
            product_code,
            name,
            price,
            image_url,
            category,
            brand,
            stock,
            description,
          },
        ]);
        const mutationEnd = Date.now();
        console.log("[ProductForm] insert finished", {
          mutationDurationMs: mutationEnd - mutationStart,
          error,
          inserted: data?.length,
        });
        if (error) throw error;
        return { id: data?.[0]?.id, data };
      }
    },
    onMutate: (variables) => {
      console.log("[ProductForm] onMutate", {
        variables,
        time: new Date().toISOString(),
      });
    },
    onSuccess: (data, variables, context) => {
      console.log("[ProductForm] onSuccess", {
        data,
        variables,
        context,
        time: new Date().toISOString(),
      });
      toast.success(editingProduct ? "Product updated" : "Product created", {
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["products-server"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (onSaved) onSaved();
    },
    onError: (err, variables, context) => {
      console.error("[ProductForm] mutation onError", {
        err,
        variables,
        context,
      });
      toast.error("Failed to save product", { position: "top-right" });
    },
    onSettled: (data, error, variables, context) => {
      console.log("[ProductForm] mutation onSettled", {
        error,
        variables,
        time: new Date().toISOString(),
      });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitStart = Date.now();
    console.log("[ProductForm] handleSubmit START", {
      time: new Date(submitStart).toISOString(),
      hasFile: !!file,
      fileSize: file?.size,
    });

    try {
      let finalImageUrl = imageUrl || null;

      if (file) {
        console.log("[ProductForm] will upload file", {
          name: file.name,
          size: file.size,
        });
        const uploadBefore = Date.now();
        const result = await uploadFileToStorage(file);
        const uploadAfter = Date.now();
        console.log("[ProductForm] uploadFileToStorage returned", {
          result,
          uploadDurationMs: uploadAfter - uploadBefore,
        });
        finalImageUrl = result?.publicUrl || finalImageUrl;
      }

      const payload = {
        id: editingProduct?.id,
        product_code: productCode,
        name,
        price: price === "" ? null : Number(price),
        image_url: finalImageUrl,
        category,
        brand,
        stock: Number(stock || 0),
        description,
      };

      console.log("[ProductForm] calling upsertMutation.mutate", {
        payloadSummary: {
          id: payload.id,
          name: payload.name,
          hasImageUrl: !!payload.image_url,
        },
        time: new Date().toISOString(),
      });

      // call mutation (React Query). mutation callbacks will log durations.
      upsertMutation.mutate(payload);

      const submitEnd = Date.now();
      console.log("[ProductForm] handleSubmit END (mutation triggered)", {
        durationMs: submitEnd - submitStart,
      });
    } catch (err) {
      console.error("[ProductForm] Failed to upload or save:", err);
      toast.error("Upload or save failed", { position: "top-right" });
    }
  };

  const saving = upsertMutation.isLoading || uploading;

  // UI helpers
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      console.log("[ProductForm] file selected", {
        name: f.name,
        size: f.size,
        type: f.type,
        time: new Date().toISOString(),
      });
      setFile(f);
    }
  };

  const clearSelectedImage = () => {
    console.log("[ProductForm] clearSelectedImage called", {
      time: new Date().toISOString(),
    });
    setFile(null);
    setPreview(null);
    setImageUrl("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TEXT FIELDS - same order as before, image section moved to bottom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product code
          </label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            className="mt-1 w-full border rounded px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock
          </label>
          <input
            type="number"
            className="mt-1 w-full border rounded px-3 py-2"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Brand
          </label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          className="mt-1 w-full border rounded px-3 py-2"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* -------------------------
          IMAGE UPLOAD SECTION (bottom)
         ------------------------- */}
      <div className="pt-4 border-t border-gray-100 mb-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product image
        </label>

        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 items-start">
          {/* Preview box */}
          <div className="w-full md:w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs text-gray-400 text-center px-2">
                No image selected
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2 justify-center h-full">
            <div className="grid grid-cols-2 gap-4">
              <label
                htmlFor="product-image"
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                <span className="text-sm font-medium text-gray-700">
                  Choose image
                </span>
              </label>

              <button
                type="button"
                onClick={clearSelectedImage}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border cursor-pointer rounded-lg hover:bg-gray-50"
              >
                <Trash2 size={14} />
                <span className="text-sm text-gray-700">Remove image</span>
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Upload an image for this product.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={saving}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-[#4eb0e3] text-white cursor-pointer"
          disabled={saving}
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </span>
          ) : editingProduct ? (
            "Save changes"
          ) : (
            "Create product"
          )}
        </Button>
      </div>
    </form>
  );
}
