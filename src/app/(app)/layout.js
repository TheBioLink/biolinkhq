import "../globals.css";
import { Lato } from "next/font/google";

const lato = Lato({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata = {
  title: "Dashboard | Biolinkhq",
};

export default function AppLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${lato.className} bg-[#0b0f14] text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
