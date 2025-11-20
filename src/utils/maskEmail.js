// src/utils/maskEmail.js
export function maskEmail(email) {
  if (!email || !email.includes("@")) return email;

  const [user, domain] = email.split("@");

  if (user.length <= 1) return `* @${domain}`;

  return `${user[0]}***@${domain}`;
}
