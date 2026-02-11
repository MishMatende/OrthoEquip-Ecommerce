async function sendQuoteEmail(quote) {
  const email = quote.customer?.email;

  if (!email) {
    alert("Customer email missing");
    return;
  }

  try {
    setSendingEmailId(quote.id);

    const link = `${window.location.origin}/quote/${quote.id}`;

    const html = `...same html...`;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          to: email,
          subject: `Quotation from Balm Ortho Medical Supplies`,
          html,
        }),
      },
    );

    if (!res.ok) {
      alert("Failed to send email");
    } else {
      alert("Email sent");
    }
  } catch (err) {
    console.error("Email send error:", err);
    alert("Failed to send email");
  } finally {
    setSendingEmailId(null);
  }
}
