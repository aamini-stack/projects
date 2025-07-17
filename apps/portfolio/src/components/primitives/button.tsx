import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  cn(
    "rounded-base box-shadow border-border bg-main text-main-foreground font-base inline-flex items-center justify-center gap-2 border-2 text-sm whitespace-nowrap",
    "hover-effect [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default: "hover-effect",
        noShadow: "shadow-none",
        neutral: "bg-secondary-background text-foreground hover-effect",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
