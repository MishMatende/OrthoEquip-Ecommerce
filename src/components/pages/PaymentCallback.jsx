import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");

  const trackingId = searchParams.get("OrderTrackingId");
  const orderId = searchParams.get("OrderMerchantReference");

  console.log("🔁 PaymentCallback mounted");
  console.log("📌 Query params:", {
    OrderTrackingId: trackingId,
    OrderMerchantReference: orderId,
  });

  useEffect(() => {
    if (!trackingId || !orderId) {
      console.error("❌ Missing required query params", {
        trackingId,
        orderId,
      });
      setStatus("error");
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 15;

    const checkStatus = async () => {
      attempts++;
      console.log(`🔍 Poll attempt ${attempts}/${MAX_ATTEMPTS}`);

      const { data, error } = await supabase
        .from("orders")
        .select("id, status, pesapal_tracking_id")
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("❌ Supabase query error:", error);
        setStatus("error");
        return;
      }

      console.log("📦 Order row from DB:", data);

      if (!data) {
        console.error("❌ No order returned from DB");
        setStatus("error");
        return;
      }

      if (data.status === "paid") {
        console.log("✅ Payment confirmed");
        setStatus("success");

        setTimeout(() => {
          console.log("➡️ Redirecting to order confirmation", data.id);
          navigate(`/order-confirmation/${data.id}`);
        }, 2000);

        return;
      }

      if (data.status === "payment_failed") {
        console.warn("⚠️ Payment failed");
        setStatus("failed");
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.warn("⏳ Max attempts reached, marking as pending");
        setStatus("pending");
        return;
      }

      console.log("⏲️ Payment still pending, retrying in 2s...");
      setTimeout(checkStatus, 2000);
    };

    checkStatus();
  }, [trackingId, orderId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {status === "checking" && (
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">
            We’re confirming your payment with Pesapal.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center text-green-600">
          <CheckCircle className="w-10 h-10 mx-auto mb-2" />
          <p>Payment successful! Redirecting…</p>
        </div>
      )}

      {status === "failed" && (
        <div className="text-center text-red-600">
          <XCircle className="w-10 h-10 mx-auto mb-2" />
          <p>Payment failed. Please try again.</p>
        </div>
      )}

      {status === "pending" && (
        <div className="text-center text-yellow-600">
          <Clock className="w-10 h-10 mx-auto mb-2" />
          <p>
            Payment is still processing.
            <br />
            Please check your orders shortly.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center text-red-600">
          <XCircle className="w-10 h-10 mx-auto mb-2" />
          <p>Unable to verify payment.</p>
        </div>
      )}
    </div>
  );
}
