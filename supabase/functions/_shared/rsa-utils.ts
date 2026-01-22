export async function importPrivateKeyPKCS8(pem: string) {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----\\n?/, "")
    .replace(/\\n-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, ""); // remove literal \n

  const rawBinary = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    rawBinary.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function signRSASHA256(data: string, privateKey: CryptoKey) {
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(data),
  );

  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
