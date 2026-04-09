import { ReactNode } from "react";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <main>
      <div className="container-shell py-6 md:py-8">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </main>
  );
}
