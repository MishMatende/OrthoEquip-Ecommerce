import React from "react";
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 select-none disabled:opacity-50 disabled:pointer-events-none [forced-color-adjust:none]",
  {
    variants: {
      variant: {
        solid:
          "bg-[#4eb0e3] text-white hover:bg-[#056eb1] border border-[#4eb0e3]",
        outline:
          "bg-white text-[#056eb1] border border-[#056eb1] hover:bg-[#4eb0e3] hover:text-white",
        ghost: "bg-transparent text-[#056eb1] hover:bg-[#4eb0e3]/10",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-[15px]",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  },
);

export function Button({
  children,
  variant,
  size,
  className = "",
  disabled = false,
  ...props
}) {
  const classes = `${buttonVariants({ variant, size })} ${className}`;

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
