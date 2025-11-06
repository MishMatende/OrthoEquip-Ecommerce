import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import emailjs from "emailjs-com";
import { Link } from "react-router-dom";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // clear error when typing
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.service) newErrors.service = "Please select a service type.";

    if (formData.phone && !/^\+?\d{7,15}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid phone number (7–15 digits).";
    }

    if (!formData.message.trim()) newErrors.message = "Message is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setStatus({ type: "", message: "" });

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
          setErrors({});
        },
        (error) => {
          console.error("EmailJS Error:", error);
          setStatus({
            type: "error",
            message: "❌ Failed to send message. Please try again later.",
          });
        }
      )
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col items-center mx-[0%] md:mx-[2%] lg:mx-[20%] text-center">
      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 w-full max-w-6xl px-4">
        <Link to="mailto:hnyambura1997@gmail.com">
          <div className="bg-white shadow-md rounded-2xl p-6 text-center border">
            <Mail className="mx-auto mb-4 text-[#0680cd] w-10 h-10" />
            <h3 className="font-semibold text-lg mb-2">Email Address</h3>
            <p className="text-gray-600">hnyambura1997@gmail.com</p>
          </div>
        </Link>

        <Link to="https://wa.me/254100219639">
          <div className="bg-white shadow-md rounded-2xl p-6 text-center border">
            <Phone className="mx-auto mb-4 text-[#0680cd] w-10 h-10" />
            <h3 className="font-semibold text-lg mb-2">Call or WhatsApp</h3>

            <p className="text-gray-600">(+254)100-219-639</p>
          </div>
        </Link>

        {/* Physical Location */}
        {/* <div className="bg-white shadow-md rounded-2xl p-6 text-center border col-span-2">
          <MapPin className="mx-auto mb-4 text-green-600 w-10 h-10" />
          <h3 className="font-semibold text-lg mb-2">Shop Address</h3>
          <p className="text-gray-600">18/A, New Born Town Hall</p>
          <p className="text-gray-600">New York, US</p>
        </div> */}
      </div>

      {/* Contact Form */}
      <div className="bg-white shadow-md rounded-2xl mt-10 p-8 w-full max-w-5xl border">
        <h2 className="text-xl font-semibold mb-6 border-l-4 border-[#0680cd] pl-3">
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

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                className={`border rounded-lg p-3 w-full focus:outline-[#0680cd] ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                className={`border rounded-lg p-3 w-full focus:outline-[#0680cd] ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Service + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className={`border rounded-lg p-3 w-full focus:outline-[#0680cd] ${
                  errors.service ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Service Type</option>
                <option value="Support">Support</option>
                <option value="Feedback">Feedback</option>
              </select>
              {errors.service && (
                <p className="text-red-500 text-sm mt-1">{errors.service}</p>
              )}
            </div>

            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                className={`border rounded-lg p-3 w-full focus:outline-[#0680cd] ${
                  errors.phone ? "border-red-500" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <textarea
              name="message"
              rows="4"
              placeholder="Enter message"
              value={formData.message}
              onChange={handleChange}
              className={`border rounded-lg p-3 w-full focus:outline-[#0680cd] ${
                errors.message ? "border-red-500" : ""
              }`}
            ></textarea>
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading
                ? "bg-[#0680cd] cursor-not-allowed"
                : "bg-white text-[#0680cd] cursor-pointer hover:bg-[#0680cd] hover:text-white"
            } font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 border border-[#0680cd]`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send Request
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Google Map */}
      {/* <div className="w-full mt-10">
        <iframe
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3021.863965430174!2d-73.964784923648!3d40.66762237933798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25b935c7e3911%3A0xf958a93d62c76d6a!2sBrooklyn%20Botanic%20Garden%20Shop!5e0!3m2!1sen!2sus!4v1713892349281!5m2!1sen!2sus"
          width="100%"
          height="400"
          allowFullScreen=""
          loading="lazy"
          className="border-0"
        ></iframe>
      </div> */}
    </div>
  );
};

export default Contact;
