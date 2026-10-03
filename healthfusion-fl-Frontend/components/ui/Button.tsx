import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-ink",
  secondary: "border border-line bg-surface text-ink hover:border-navy",
  ghost: "text-ink hover:bg-surface",
};

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  type = "button",
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const classes = cn(
    "hf-focus inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors",
    variants[variant],
    disabled && "pointer-events-none opacity-60",
    className
  );
  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
