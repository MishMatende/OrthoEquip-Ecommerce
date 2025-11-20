// src/pages/AboutPageWrapper.jsx
import React, { useEffect, useState } from "react";
import About from "./About";

export default function AboutPageWrapper() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetch("/content/about_content.json")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load about_content.json");
        return r.json();
      })
      .then((data) => setContent(data))
      .catch((err) => {
        console.error("Failed to load about content:", err);
      });
  }, []);

  return <About content={content} />;
}
