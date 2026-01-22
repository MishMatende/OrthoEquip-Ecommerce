// Deno environment: HMAC-SHA256 + Base64

export async function generateSignature(
  accountNumber: string,
  ref: string,
  mobileNumber: string,
  telco: string,
  amount: string,
  currency: string,
  consumerSecret: string
): Promise<string> {

  const raw = accountNumber + ref + mobileNumber + telco + amount + currency;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(consumerSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(raw)
  );

  const signatureBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  return signatureBase64;
}
