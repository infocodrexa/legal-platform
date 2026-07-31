import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Seal } from "@/components/site/seal";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-32 text-center">
        <Seal size={100} label="NOT FOUND" sublabel="NO RECORD ON FILE" className="text-ink/30" />
        <h1 className="mt-8 font-display text-4xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 max-w-sm text-ink-muted">
          There&rsquo;s no record matching that address. It may have moved, or the link might be out of date.
        </p>
        <Button className="mt-8" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
