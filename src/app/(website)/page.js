import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Link from "next/link";

// Components
import HeroForm from "@/components/forms/HeroForm";
import Carousel from "@/components/Carousel";
import GridContainer from "@/components/GridContainer";
import ImageGrid from "@/components/ImageGrid";
import NewOwnershipPopup from "@/components/NewOwnershipPopup";
import TrustpilotReviewCollector from "@/components/TrustpilotReviewCollector";
import AdWrapper from "@/components/AdWrapper";

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

      <AdWrapper slot="1234567890" />

      <div className="mt-20 max-w-5xl text-center mx-auto">
        <h1 className="mb-5 text-5xl font-bold">
          You never have to change the link in your bio again
        </h1>

        <p>
          Back in 2016 the original link-in-bio platforms solved social media’s
          most annoying problem...
        </p>
      </div>

      <GridContainer />

      <AdWrapper slot="1234567890" />

      <div className="mt-20 max-w-5xl text-center mx-auto">
        <h1 className="mb-5 text-5xl font-bold">
          Turn your Link In Bio into your own mini-website
        </h1>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-md border bg-blue-500 p-2 px-3 font-bold text-white shadow hover:bg-blue-300"
        >
          Start now
        </Link>
      </div>

      <TrustpilotReviewCollector />

      <AdWrapper slot="1234567890" />

      <ImageGrid images={imageUrls} />
    </main>
  );
}
