import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AppQueryProvider } from "@/lib/query-provider";

// NOTE: next/font/google (Source Serif 4 / Inter / IBM Plex Mono) is the
// intended setup — see the commented block below — but this build
// environment's network doesn't reach fonts.googleapis.com, so `next build`
// fails if next/font/google is used. Using well-matched system font stacks
// as a drop-in fallback instead. To restore the designed typefaces in a
// real deployment (which has open internet access), replace this file's
// font setup with the commented block.
//
// import { Source_Serif_4, Inter, IBM_Plex_Mono } from "next/font/google";
// const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], weight: ["500","600","700"], display: "swap" });
// const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400","500","600","700"], display: "swap" });
// const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400","500"], display: "swap" });
// Then: className={`${sourceSerif.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}

const fontVariablesStyle = {
  "--font-source-serif": "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif",
  "--font-inter": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  "--font-plex-mono": "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
};

export const metadata = {
  title: {
    default: "Legal Platform — Verified Documents, Real Lawyers",
    template: "%s — Legal Platform",
  },
  description:
    "Get your legal documents verified and consult qualified lawyers online. Document review, appointment booking, and secure payments in one place.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" style={fontVariablesStyle}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <AppQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
