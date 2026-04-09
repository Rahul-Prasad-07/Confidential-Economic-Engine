import Link from "next/link";

type NavItem = { label: string; href: string };

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Platform", href: "/platform" },
  { label: "Solutions", href: "/solutions" },
  { label: "Security", href: "/security" },
  { label: "Console", href: "/console" },
  { label: "Careers", href: "/careers" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-3 z-30">
      <nav className="surface px-3 py-2">
        <ul className="flex flex-wrap items-center gap-2">
          <li className="mr-auto rounded-full border border-black/10 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-calm text-slate-800">
            <Link href="/">MagicBlock Agentic Privacy Desk</Link>
          </li>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex rounded-full border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-black/10 hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
