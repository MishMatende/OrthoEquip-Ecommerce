import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import toast, { Toaster } from "react-hot-toast";

export default function RatingsPage() {
  const { productId } = useParams();

  const [ratings, setRatings] = useState([]);
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchProduct() {
    const { data } = await supabase
      .from("products")
      .select("id,name,image_url,description")
      .eq("id", productId)
      .single();

    setProduct(data);
  }

  async function fetchRatings() {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        comment,
        anonymous,
        created_at,
        profiles(username)
      `,
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load ratings");
      return;
    }

    setRatings(data);
  }

  useEffect(() => {
    fetchProduct();
    fetchRatings();
  }, []);

  async function submitRating(e) {
    e.preventDefault();

    setLoading(true);

    const user = await supabase.auth.getUser();

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      rating,
      comment,
      anonymous,
      user_id: user.data.user.id,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to submit rating");
      return;
    }

    toast.success("Review submitted!");

    setComment("");
    setRating(5);

    fetchRatings();
  }

  function StarRating({ value, onChange }) {
    const [hover, setHover] = useState(0);

    const labels = {
      1: "Poor 😞",
      2: "Fair 😐",
      3: "Good 🙂",
      4: "Very Good 😊",
      5: "Excellent 🤩",
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-center  gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`text-4xl transition-all duration-200 transform hover:scale-125 ${
                star <= (hover || value) ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <span className="text-sm font-medium text-gray-500">
          {labels[hover || value]}
        </span>
      </div>
    );
  }

  const avgRating =
    ratings.length > 0
      ? (
          ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
        ).toFixed(1)
      : 0;

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <Toaster />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Reviews</h1>

        {/* Top Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Product Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {product?.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}

            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {product?.name}
            </h2>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-400 text-lg">
                {"★".repeat(Math.round(avgRating))}
              </span>

              <span className="text-gray-600 text-sm">
                {avgRating} ({ratings.length} reviews)
              </span>
            </div>

            <p className="text-gray-600 text-sm">{product?.description}</p>
          </div>

          {/* Review Form */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Write a Review
            </h2>

            <form onSubmit={submitRating} className="space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Your Rating
                </label>

                <StarRating value={rating} onChange={setRating} />
              </div>

              {/* Comment */}
              <div className="relative">
                <textarea
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="peer w-full border border-gray-200 rounded-xl px-4 pt-5 pb-3 text-gray-700 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#4eb0e3]"
                  placeholder="Write your review"
                />

                <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400">
                  Share your experience
                </label>
              </div>

              {/* Anonymous Toggle */}
              <label className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">
                  Post anonymously
                </span>

                <div className="relative">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />

                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#4eb0e3] transition"></div>

                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                </div>
              </label>

              {/* Submit Button */}
              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#4eb0e3] to-[#056eb1] hover:opacity-90 text-white font-medium py-3 rounded-xl shadow-md transition"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {ratings.map((r) => (
            <div
              key={r.id}
              className="bg-white border rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-yellow-400">{"★".repeat(r.rating)}</div>

                <span className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-gray-700 mb-2">{r.comment}</p>

              <p className="text-sm text-gray-500">
                {r.anonymous
                  ? "Anonymous"
                  : `@${r.profiles?.username || "user"}`}
              </p>
            </div>
          ))}

          {ratings.length === 0 && (
            <p className="text-center text-gray-500 mt-6">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
