import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-gray-300 bg-white text-black hover:bg-[#4eb0e3] hover:text-white hover:border-[#4eb0e3]",
        filled: "bg-[#4eb0e3] text-white hover:bg-[#056eb1] cursor-pointer",
        ghost:
          "text-black hover:bg-[#4eb0e3]/10 hover:text-[#4eb0e3] cursor-pointer",
        outline:
          "border border-gray-300 bg-transparent text-black hover:bg-[#4eb0e3] hover:text-white cursor-pointer",
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
