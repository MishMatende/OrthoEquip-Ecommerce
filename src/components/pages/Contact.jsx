import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import emailjs from "emailjs-com";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: "",
    phone: "",
    message: "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setStatus({ type: "error", message: "Please enter a valid email." });
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    emailjs
      .send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formData,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setStatus({
            type: "success",
            message: "✅ Your message has been sent successfully!",
          });
          setFormData({
            name: "",
            email: "",
            service: "",
            phone: "",
            message: "",
          });
        },
        (error) => {
          console.error("EmailJS Error:", error);
          setStatus({
            type: "error",
            message: "❌ Failed to send message. Please try again later.",
          });
        }
      );
  };

  return (
    <div className="flex flex-col items-center">
      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 w-full max-w-6xl px-4">
        <div className="bg-white shadow-md rounded-2xl p-6 text-center border">
          <Mail className="mx-auto mb-4 text-green-600 w-10 h-10" />
          <h3 className="font-semibold text-lg mb-2">Email Address</h3>
          <p className="text-gray-600">info@webmail.com</p>
          <p className="text-gray-600">jobs@webexample.com</p>
        </div>

        <div className="bg-white shadow-md rounded-2xl p-6 text-center border">
          <Phone className="mx-auto mb-4 text-green-600 w-10 h-10" />
          <h3 className="font-semibold text-lg mb-2">Phone Number</h3>
          <p className="text-gray-600">+0123-456789</p>
          <p className="text-gray-600">+987-6543210</p>
        </div>

        <div className="bg-white shadow-md rounded-2xl p-6 text-center border">
          <MapPin className="mx-auto mb-4 text-green-600 w-10 h-10" />
          <h3 className="font-semibold text-lg mb-2">Office Address</h3>
          <p className="text-gray-600">18/A, New Born Town Hall</p>
          <p className="text-gray-600">New York, US</p>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white shadow-md rounded-2xl mt-10 p-8 w-full max-w-5xl border">
        <h2 className="text-xl font-semibold mb-6 border-l-4 border-green-600 pl-3">
          Get a Queue
        </h2>

        {status.message && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              status.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              className="border rounded-lg p-3 w-full focus:outline-green-600"
            />
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              className="border rounded-lg p-3 w-full focus:outline-green-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="border rounded-lg p-3 w-full focus:outline-green-600"
            >
              <option value="">Select Service Type</option>
              <option value="Consultation">Consultation</option>
              <option value="Support">Support</option>
              <option value="Feedback">Feedback</option>
            </select>
            <input
              type="tel"
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              className="border rounded-lg p-3 w-full focus:outline-green-600"
            />
          </div>

          <textarea
            name="message"
            rows="4"
            placeholder="Enter message"
            value={formData.message}
            onChange={handleChange}
            className="border rounded-lg p-3 w-full focus:outline-green-600"
          ></textarea>

          <button
            type="submit"
            className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            Get a free service
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Google Map */}
      <div className="w-full mt-10">
        <iframe
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3021.863965430174!2d-73.964784923648!3d40.66762237933798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25b935c7e3911%3A0xf958a93d62c76d6a!2sBrooklyn%20Botanic%20Garden%20Shop!5e0!3m2!1sen!2sus!4v1713892349281!5m2!1sen!2sus"
          width="100%"
          height="400"
          allowFullScreen=""
          loading="lazy"
          className="border-0"
        ></iframe>
      </div>
    </div>
  );
};

export default Contact;
