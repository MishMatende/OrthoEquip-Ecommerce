import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");

  // ✅ Correct params from Pesapal
  const trackingId = searchParams.get("OrderTrackingId");
  const orderId = searchParams.get("OrderMerchantReference");

  useEffect(() => {
    if (!trackingId || !orderId) {
      setStatus("error");
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 15;

    const checkStatus = async () => {
      attempts++;

      const { data, error } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (error || !data) {
        setStatus("error");
        return;
      }

      if (data.status === "paid") {
        setStatus("success");
        setTimeout(() => {
          navigate(`/order-confirmation/${orderId}`);
        }, 2000);
        return;
      }

      if (data.status === "payment_failed") {
        setStatus("failed");
        return;
      }

      // Still pending → retry with limit
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(checkStatus, 2000);
      } else {
        setStatus("pending");
      }
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
            <br />
            This usually takes a few seconds.
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
