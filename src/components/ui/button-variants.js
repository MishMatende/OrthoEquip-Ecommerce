import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-gray-300 bg-white text-black hover:bg-[#0680cd] hover:text-white hover:border-[#0680cd]",
        filled: "bg-[#0680cd] text-white hover:bg-[#056eb1]",
        ghost: "text-black hover:bg-[#0680cd]/10 hover:text-[#0680cd]",
        outline:
          "border border-gray-300 bg-transparent text-black hover:bg-[#0680cd] hover:text-white",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-sm",
        lg: "h-10 px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
);
