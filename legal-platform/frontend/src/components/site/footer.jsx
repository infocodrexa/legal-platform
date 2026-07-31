import Link from "next/link";
import { Seal } from "@/components/site/seal";
import { footerNav } from "@/components/site/nav-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-paper-line bg-ink text-paper mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="font-display text-xl font-semibold text-cream-white">
                Nyaya<span className="text-seal-soft">Setu</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/60">
              Document verification and lawyer consultation, in one place.
              Every lawyer on the platform is Bar Council verified before
              they take a single client.
            </p>
            <div className="mt-6 flex items-center gap-3 text-paper/50">
              <Seal size={56} className="text-paper/40" />
              <span className="font-mono text-[11px] uppercase tracking-widest">
                Registered platform
                <br />
                Est. 2026
              </span>
            </div>
          </div>

          {Object.entries(footerNav).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-mono text-xs uppercase tracking-widest text-paper/50">{heading}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-paper/75 hover:text-seal-soft transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-paper/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-paper/45">
            © {new Date().getFullYear()} NyayaSetu. All rights reserved.
          </p>
          <p className="text-xs text-paper/45">
            NyayaSetu is a technology platform. It does not provide legal
            advice; consultations are conducted independently by verified,
            licensed lawyers.
          </p>
        </div>
      </div>
    </footer>
  );
}
