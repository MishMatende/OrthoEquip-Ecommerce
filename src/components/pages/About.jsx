// src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";
import BalmOrthoLogo from "../../assets/BalmOrthoLogo.png";

export default function About({
  content = null,
  policiesUrl = encodeURI(
    "/mnt/data/BALM ORTHO MEDICAL SUPPLIES - POLICIES.docx"
  ),
}) {
  // default content (falls back to this if no content prop passed)
  const defaultContent = {
    hero: {
      title: "Balm Ortho Medical Supplies",
      subtitle:
        "Kenya’s dedicated e-commerce platform for orthopedic and general medical supplies — supporting hospitals, clinics and healthcare professionals with reliable access to certified products, competitive pricing and dependable delivery nationwide.",
      primaryCta: { label: "Shop products", href: "/shop" },
      secondaryCta: { label: "Company policies", href: policiesUrl },
    },
    stats: [
      { title: "Nationwide delivery", value: "Across Kenya" },
      { title: "Trusted partners", value: "Hospitals & Clinics" },
      { title: "Product categories", value: "Orthopedics & Consumables" },
      { title: "Support", value: "Phone & Email" },
    ],
    features: [
      {
        title: "Our Vision",
        text: "To be Kenya's most trusted ecommerce platform in orthopedic and medical supply solutions, empowering healthcare providers to deliver exceptional patient care through reliable access to quality medical products.",
        accent: "#F0FAFF",
      },
      {
        title: "Our Mission",
        text: "Provide healthcare facilities, clinics, and practitioners across Kenya with high quality orthopedic and medical supplies — ensuring timely delivery, competitive pricing and exceptional service while maintaining strict regulatory compliance.",
        accent: "#F7FFF6",
      },
      {
        title: "Core Values",
        text: [
          {
            label: "Quality Assurance",
            body: "Only certified, reliable products.",
          },
          { label: "Reliability", body: "Timely delivery you can trust." },
          {
            label: "Integrity",
            body: "Transparent pricing and honest practices.",
          },
          { label: "Customer Focus", body: "Building lasting partnerships." },
          {
            label: "Accessibility",
            body: "Making supplies available across Kenya.",
          },
        ],
        accent: "#fff7f0",
      },
    ],
    policies: {
      text: "Read our refund, privacy and terms of service to understand your rights and our commitments. Downloads available below.",
    },
    contact: {
      email: "balmortho93@gmail.com",
      phone: "+2540100219639",
      location: "Nairobi, Kenya",
    },
    faq: [
      {
        q: "Where can I buy medical supplies?",
        a: "Balm Ortho is the leading ecommerce platform selling quality medical items. Visit our Shop to browse categories and order online.",
      },
      {
        q: "How can I create an account?",
        a: "Click on the profile icon in the top-right, fill in your details and confirm your email. Once registered you can purchase online.",
      },
      {
        q: "Can I purchase a product over the phone or WhatsApp?",
        a: "Yes — orders can be placed via our office number or email. We'll help arrange payment and delivery.",
      },
      {
        q: "Do you stock multiple brands?",
        a: "Yes — we have a variety of brands. If a specific brand isn't listed, contact us and we'll check availability.",
      },
    ],
    cta: {
      title: "Ready to equip your facility?",
      text: "Browse our product range or contact our team for bulk orders and credit terms.",
      primary: { label: "Browse products", href: "/shop" },
      secondary: {
        label: "Contact sales",
        href: "mailto:balmortho93@gmail.com",
      },
    },
  };

  const data = content || defaultContent;

  // animation presets
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };
  const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* HERO */}
      <section className="relative bg-gradient-to-b from-white via-[#f7fbfd] to-white">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-6"
            >
              <motion.img
                variants={fadeUp}
                src={BalmOrthoLogo}
                alt="Balm Ortho Logo"
                className="h-16 mb-2"
              />
              <motion.h1
                variants={fadeUp}
                className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900"
              >
                {data.hero.title}
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="text-lg text-gray-600 max-w-xl"
              >
                {data.hero.subtitle}
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-3"
              >
                <a
                  href={data.hero.primaryCta.href}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#4eb0e3] text-white font-semibold shadow hover:bg-[#3ca0d4] transition"
                >
                  {data.hero.primaryCta.label}
                </a>

                <a
                  href={data.hero.secondaryCta.href}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:shadow transition"
                  download
                >
                  {data.hero.secondaryCta.label}
                </a>
              </motion.div>
            </motion.div>

            {/* Right: stats / visual panel */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#eaf8ff] p-6 sm:p-10">
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-4"
                  >
                    {data.stats.map((s, i) => (
                      <motion.div
                        key={i}
                        variants={fadeUp}
                        className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4"
                      >
                        <div className="w-12 h-12 bg-[#e8f8ff] rounded-lg flex items-center justify-center text-[#0a2540] font-semibold">
                          {/* small badge: first letters */}
                          {s.title
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{s.title}</p>
                          <p className="font-semibold text-gray-900">
                            {s.value}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.p
                    variants={fadeUp}
                    className="mt-6 text-sm text-gray-600"
                  >
                    We combine specialized product knowledge with reliable
                    logistics and secure payments so healthcare providers can
                    focus on patient care.
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MISSION / VISION / VALUES */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {data.features.map((f, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: f.accent }}
            >
              <h4 className="text-lg font-semibold mb-2">{f.title}</h4>

              {Array.isArray(f.text) ? (
                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                  {f.text.map((item, i) => (
                    <li key={i} className="text-sm">
                      <strong>{item.label}:</strong> {item.body}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-700">{f.text}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Policies & Contact */}
      <section className="bg-[#f8fafc] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Policies & Terms</h3>
            <p className="text-gray-600 mb-3 max-w-md">{data.policies.text}</p>
            <a
              href={policiesUrl}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border rounded-lg hover:shadow"
              download
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3V15"
                  stroke="#0A2540"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 11L12 15L16 11"
                  stroke="#0A2540"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 21H3"
                  stroke="#0A2540"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download policies (DOCX)
            </a>
          </div>

          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-lg shadow text-sm">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{data.contact.email}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-sm">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{data.contact.phone}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-sm">
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-gray-900">
                {data.contact.location}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6">
          Frequently Asked Questions (FAQS)
        </h2>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {data.faq.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="p-4 bg-white rounded-lg shadow-sm"
            >
              <p className="font-medium mb-2">{f.q}</p>
              <p className="text-sm text-gray-600">{f.a}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-[#0b2335] text-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold">{data.cta.title}</h3>
            <p className="text-gray-200 text-sm">{data.cta.text}</p>
          </div>

          <div className="flex gap-3">
            <a
              href={data.cta.primary.href}
              className="px-5 py-3 rounded-lg bg-[#4eb0e3] text-[#04283a] font-semibold hover:bg-[#3ca0d4] transition"
            >
              {data.cta.primary.label}
            </a>
            <a
              href={data.cta.secondary.href}
              className="px-5 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition"
            >
              {data.cta.secondary.label}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
