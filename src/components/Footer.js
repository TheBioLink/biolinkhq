import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0b0f14] border-t border-white/10 py-6">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center">
          <Image src={"/assets/logo.webp"} alt="logo" width={34} height={34} />
          <span className="font-extrabold text-xl ml-2 text-gray-100">
            Biolinkhq
          </span>
        </div>

        <div className="text-sm text-gray-400 md:flex-1 md:text-center">
          © {new Date().getFullYear()} Biolinkhq by theceosolace. All rights reserved.
        </div>

        <div className="flex gap-4 text-sm font-bold">
          <Link href="/privacy" className="text-gray-300 hover:text-white">
            Privacy
          </Link>
          <a
            href="https://twitter.com/biolinkhq"
            target="_blank"
            rel="noreferrer"
            className="text-gray-300 hover:text-white"
          >
            X
          </a>
          <a
            href="https://github.com/biolinkhq"
            target="_blank"
            rel="noreferrer"
            className="text-gray-300 hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
