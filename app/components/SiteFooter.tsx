import Link from "next/link";

export function SiteFooter() {
  return (
    <footer id="contact" className="surface mt-6 mb-8 scroll-mt-24 px-6 py-6">
      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="muted-label">Official Website</p>
          <p className="mt-1 text-sm leading-7 text-slate-700">
            MagicBlock Agentic Privacy Desk — private execution infrastructure for autonomous finance.
          </p>
          <p className="mt-3 text-xs text-slate-500">© {new Date().getFullYear()} MagicBlock Agentic Privacy Desk</p>
        </div>

        <div>
          <p className="muted-label">Product</p>
          <div className="mt-2 flex flex-col items-start gap-2 text-sm">
            <Link href="/platform" className="text-slate-700 hover:text-slate-900">Platform</Link>
            <Link href="/solutions" className="text-slate-700 hover:text-slate-900">Solutions</Link>
            <Link href="/security" className="text-slate-700 hover:text-slate-900">Security</Link>
            <Link href="/console" className="text-slate-700 hover:text-slate-900">Console</Link>
          </div>
        </div>

        <div>
          <p className="muted-label">Company</p>
          <div className="mt-2 flex flex-col items-start gap-2 text-sm">
            <Link href="/about" className="text-slate-700 hover:text-slate-900">About</Link>
            <Link href="/careers" className="text-slate-700 hover:text-slate-900">Careers</Link>
            <a href="https://github.com/Rahul-Prasad-07/Confidential-Economic-Engine" className="text-slate-700 hover:text-slate-900" target="_blank" rel="noreferrer">Repository</a>
            <a href="/about#privacy" className="text-slate-700 hover:text-slate-900">Privacy</a>
            <a href="/about#terms" className="text-slate-700 hover:text-slate-900">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
