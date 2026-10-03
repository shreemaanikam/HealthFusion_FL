import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";

const primaryLinks = [
  { href: "/for-hospitals", label: "For hospitals" },
  { href: "/product", label: "Product" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/technology", label: "Technology" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/research", label: "Research" },
  { href: "/documentation", label: "Documentation" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a href="#main-content" className="hf-skip-link">Skip to content</a>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="hf-focus flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-teal" />
            <span className="font-display text-base font-bold tracking-tight text-navy">HealthFusion_FL</span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {primaryLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hf-focus text-sm text-slate hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/demo" className="hf-focus hidden text-sm text-slate hover:text-ink sm:block">
              Demo
            </Link>
            <Button href="/login" variant="secondary" className="hidden text-sm lg:inline-flex">
              Log in
            </Button>
            <PublicMobileNav />
          </div>
        </div>
      </header>
      <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <footer className="hf-rule">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-teal" />
                <span className="font-display text-sm font-bold text-navy">HealthFusion_FL</span>
              </div>
              <p className="mt-2 max-w-xs text-sm text-mist">
                Explainable Adaptive Federated Healthcare Intelligence Framework. Academic research platform — AD4V71.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy">Platform</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate">
                <li><Link href="/for-hospitals" className="hf-focus hover:text-ink">For hospitals</Link></li>
                <li><Link href="/product" className="hf-focus hover:text-ink">Product</Link></li>
                <li><Link href="/how-it-works" className="hf-focus hover:text-ink">How it works</Link></li>
                <li><Link href="/technology" className="hf-focus hover:text-ink">Technology</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy">Trust</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate">
                <li><Link href="/security" className="hf-focus hover:text-ink">Security</Link></li>
                <li><Link href="/privacy" className="hf-focus hover:text-ink">Privacy</Link></li>
                <li><Link href="/research" className="hf-focus hover:text-ink">Research</Link></li>
                <li><Link href="/documentation" className="hf-focus hover:text-ink">Documentation</Link></li>
                <li><Link href="/request-pilot" className="hf-focus hover:text-ink">Request a pilot</Link></li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-xs text-mist">
            Prototype interface for a research project. Clinical outputs are decision support, not a diagnosis.
          </p>
        </div>
      </footer>
    </div>
  );
}
