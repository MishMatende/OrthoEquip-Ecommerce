// src/components/ui/button.jsx
import React from "react";

export function Button({
  children,
  variant = "solid",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    solid:
      "bg-[#4eb0e3] text-white hover:bg-[#056eb1] border border-[#4eb0e3] hover:cursor-pointer",
    outline:
      "bg-white text-[#056eb1] border border-[#056eb1] hover:bg-[#4eb0e3] hover:text-black hover:cursor-pointer",
    ghost:
      "bg-transparent text-[#056eb1] hover:bg-[#4eb0e3]/10 hover:text-[#056eb1] border border-transparent hover:cursor-pointer",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-[15px] px-4 py-2",
    lg: "text-base px-5 py-2.5",
    icon: "p-2",
  };

  const finalClass = [
    base,
    variants[variant] || variants.solid,
    sizes[size] || sizes.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={finalClass} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
