// src/app/page.js
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import HeroForm from "@/components/forms/HeroForm";
import { getServerSession } from "next-auth";
import Carousel from "@/components/Carousel";
import GridContainer from "@/components/GridContainer";
import Link from "next/link";
import ImageGrid from "@/components/ImageGrid";
import NewOwnershipPopup from "@/components/NewOwnershipPopup";
import TrustpilotReviewCollector from "@/components/TrustpilotReviewCollector";
import AdBlock from "@/components/AdBlock"; // 🔥 ADDED

const imageUrls = [
  "/assets/polly.png",
  "/assets/preview.png",
  "/assets/doggie.png",
  "/assets/manfred.png",
  "/assets/walter.png",
  "/assets/model.png",
  "/assets/cat.png",
  "/assets/model1.png",
];

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main>
      <NewOwnershipPopup />

      {/* HERO */}
      <section className="flex flex-wrap items-center justify-center pt-32 md:flex-nowrap">
        <div className="mb-8 max-w-6xl md:mb-0 md:mr-8">
          <h1 className="text-6xl font-bold">Everything in one</h1>
          <h2 className="mb-4 mt-6 text-xl text-gray-500">
            Share your links, social media profiles, contact info and more on
            one page
          </h2>
          <HeroForm user={session?.user} />
        </div>

        <Carousel images={imageUrls} />
      </section>

      {/* 🔥 AD (below hero, high visibility but not intrusive) */}
      <div className="mt-10 flex justify-center">
        <div className="w-full max-w-4xl">
          <AdBlock slot="1234567890" />
        </div>
      </div>

      {/* SECTION 1 */}
      <div className="mt-20 max-w-5xl text-center mx-auto">
        <h1 className="mb-5 text-5xl font-bold">
          You never have to change the link in your bio again
        </h1>
        <p>
          Back in 2016 the original link-in-bio platforms solved social media’s
          most annoying problem: only having one link in your bio. Biolinkhq
          continues that tradition and has since become so much more — allowing
          businesses or creators to get more out of their social media, grow
          their following, easily take payments and take back control of how
          your content is discovered.
        </p>
      </div>

      <GridContainer />

      {/* 🔥 AD (mid-page, best RPM zone) */}
      <div className="mt-16 flex justify-center">
        <div className="w-full max-w-4xl">
          <AdBlock slot="1234567890" />
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="mt-20 max-w-5xl text-center mx-auto">
        <h1 className="mb-5 text-5xl font-bold">
          Turn your Link In Bio into your own mini-website
        </h1>
        <p>
          It takes seconds to turn your bio into a mini website, allowing your
          followers to engage with your content, discover you on other platforms
          or purchase and support you with just one simple link.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-md border bg-blue-500 p-2 px-3 font-bold text-white shadow hover:bg-blue-300"
        >
          Start now
        </Link>
      </div>

      {/* SOCIAL PROOF */}
      <TrustpilotReviewCollector />

      {/* 🔥 AD (before image grid, high engagement area) */}
      <div className="mt-16 flex justify-center">
        <div className="w-full max-w-4xl">
          <AdBlock slot="1234567890" />
        </div>
      </div>

      <ImageGrid images={imageUrls} />
    </main>
  );
}
