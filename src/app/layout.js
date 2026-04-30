import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "BioLinkHQ",
  description: "Your all-in-one bio link platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Google AdSense (global load) */}
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8336311096274398"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
