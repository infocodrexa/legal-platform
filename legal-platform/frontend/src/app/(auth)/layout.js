import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-paper-line">
        <div className="mx-auto flex h-18 max-w-7xl items-center px-4 sm:px-6 lg:px-8" style={{ height: "4.5rem" }}>
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="15" cy="15" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-seal" />
              <path
                d="M10 15 L13.5 18.5 L20.5 11.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-seal"
              />
            </svg>
            <span className="font-display text-lg font-semibold text-ink">
              Nyaya<span className="text-seal">Setu</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">{children}</main>
    </div>
  );
}
