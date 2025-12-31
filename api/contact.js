import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, service, phone, message } = req.body;

    if (!name || !email || !service || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await resend.emails.send({
      from: "Balm Ortho Medical Supplies <no-reply@balmorthomedical.com>",
      to: ["balmortho93@gmail.com"],
      replyTo: `${name} <${email}>`,
      subject: `New Contact Request — ${service}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Service:</strong> ${service}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
