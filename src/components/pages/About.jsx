// src/pages/About.jsx
import React from "react";
import { motion } from "framer-motion";
import BalmOrthoLogo from "../../assets/BalmOrthoLogo.png";

export default function About() {
  const policiesUrl = encodeURI(
    "/public/content/BALM ORTHO MEDICAL SUPPLIES - POLICIES.pdf"
  );

  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };
  const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

  return (
    <div className="min-h-screen bg-white text-gray-800">
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
                Balm Ortho Medical Supplies
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg text-gray-600 max-w-xl"
              >
                Kenya’s dedicated e-commerce platform for orthopedic and general
                medical supplies — supporting hospitals, clinics and healthcare
                professionals with reliable access to certified products,
                competitive pricing and dependable delivery nationwide.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-3"
              >
                <a
                  href="/shop"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#4eb0e3] text-white font-semibold shadow hover:bg-[#3ca0d4] transition"
                >
                  Shop products
                </a>

                <a
                  href={policiesUrl}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:shadow transition"
                  download
                >
                  Company policies
                </a>
              </motion.div>
            </motion.div>

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
                    <motion.div
                      variants={fadeUp}
                      className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-[#e8f8ff] rounded-lg flex items-center justify-center text-[#0a2540] font-semibold">
                        ND
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Nationwide delivery
                        </p>
                        <p className="font-semibold text-gray-900">
                          Across Kenya
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={fadeUp}
                      className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-[#e8f8ff] rounded-lg flex items-center justify-center text-[#0a2540] font-semibold">
                        TP
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Trusted partners
                        </p>
                        <p className="font-semibold text-gray-900">
                          Hospitals & Clinics
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={fadeUp}
                      className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-[#e8f8ff] rounded-lg flex items-center justify-center text-[#0a2540] font-semibold">
                        PC
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Product categories
                        </p>
                        <p className="font-semibold text-gray-900">
                          Orthopedics & Consumables
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={fadeUp}
                      className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-[#e8f8ff] rounded-lg flex items-center justify-center text-[#0a2540] font-semibold">
                        S
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Support</p>
                        <p className="font-semibold text-gray-900">
                          Phone & Email
                        </p>
                      </div>
                    </motion.div>
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

      <section className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            variants={fadeUp}
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: "#F0FAFF" }}
          >
            <h4 className="text-lg font-semibold mb-2">Our Vision</h4>
            <p className="text-sm text-gray-700">
              To be Kenya's most trusted ecommerce platform in orthopedic and
              medical supply solutions, empowering healthcare providers to
              deliver exceptional patient care through reliable access to
              quality medical products.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: "#F7FFF6" }}
          >
            <h4 className="text-lg font-semibold mb-2">Our Mission</h4>
            <p className="text-sm text-gray-700">
              Provide healthcare facilities, clinics, and practitioners across
              Kenya with high quality orthopedic and medical supplies — ensuring
              timely delivery, competitive pricing and exceptional service while
              maintaining strict regulatory compliance.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: "#fff7f0" }}
          >
            <h4 className="text-lg font-semibold mb-2">Core Values</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
              <li className="text-sm">
                <strong>Quality Assurance:</strong> Only certified, reliable
                products.
              </li>
              <li className="text-sm">
                <strong>Reliability:</strong> Timely delivery you can trust.
              </li>
              <li className="text-sm">
                <strong>Integrity:</strong> Transparent pricing and honest
                practices.
              </li>
              <li className="text-sm">
                <strong>Customer Focus:</strong> Building lasting partnerships.
              </li>
              <li className="text-sm">
                <strong>Accessibility:</strong> Making supplies available across
                Kenya.
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </section>

      <section className="bg-[#f8fafc] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Policies & Terms</h3>
            <p className="text-gray-600 mb-3 max-w-md">
              Read our refund, privacy and terms of service to understand your
              rights and our commitments. Downloads available below.
            </p>
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
              Download policies (PDF)
            </a>
          </div>

          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-lg shadow text-sm">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">balmortho93@gmail.com</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-sm">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">+2540100219639</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-sm">
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-gray-900">Nairobi, Kenya</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6">
          Frequently Asked Questions
        </h2>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <motion.div
            variants={fadeUp}
            className="p-4 bg-white rounded-lg shadow-sm"
          >
            <p className="font-medium mb-2">
              Where can I buy medical supplies?
            </p>
            <p className="text-sm text-gray-600">
              Balm Ortho is the leading ecommerce platform selling quality
              medical items. Visit our Shop to browse categories and order
              online.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="p-4 bg-white rounded-lg shadow-sm"
          >
            <p className="font-medium mb-2">How can I create an account?</p>
            <p className="text-sm text-gray-600">
              Click on the profile icon in the top-right, fill in your details
              and confirm your email. Once registered you can purchase online.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="p-4 bg-white rounded-lg shadow-sm"
          >
            <p className="font-medium mb-2">
              Can I purchase a product over the phone or WhatsApp?
            </p>
            <p className="text-sm text-gray-600">
              Yes — orders can be placed via our office number or email. We'll
              help arrange payment and delivery.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="p-4 bg-white rounded-lg shadow-sm"
          >
            <p className="font-medium mb-2">Do you stock multiple brands?</p>
            <p className="text-sm text-gray-600">
              Yes — we have a variety of brands. If a specific brand isn't
              listed, contact us and we'll check availability.
            </p>
          </motion.div>
        </motion.div>
      </section>

      <footer className="bg-[#0b2335] text-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold">
              Ready to equip your facility?
            </h3>
            <p className="text-gray-200 text-sm">
              Browse our product range or contact our team for bulk orders and
              credit terms.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/shop"
              className="px-5 py-3 rounded-lg bg-[#4eb0e3] text-[#04283a] font-semibold hover:bg-[#3ca0d4] transition"
            >
              Browse products
            </a>
            <a
              href="mailto:balmortho93@gmail.com"
              className="px-5 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition"
            >
              Contact sales
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
