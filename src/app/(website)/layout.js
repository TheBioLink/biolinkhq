import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lato } from "next/font/google";
import "../globals.css";

const lato = Lato({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata = {
  title: "Biolinkhq by theceosolace",
  description:
    "Share your links, social profiles, contact info and more on one page with Biolinkhq",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${lato.className} bg-[#0b0f14] text-gray-100`}>
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6 min-h-screen">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
