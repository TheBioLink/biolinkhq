import { Lato } from "next/font/google";
import "../../globals.css";

const lato = Lato({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata = {
  title: "Biolinkhq by theceosolace",
  description: "Public profile",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${lato.className} bg-[#0b0f14] text-gray-100`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
