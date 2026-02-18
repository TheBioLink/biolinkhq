export const metadata = {
  title: "Biolinkhq by theceosolace | Privacy",
  description: "Privacy policy for Biolinkhq by theceosolace",
};

export default function PrivacyPage() {
  const effectiveDate = "2026-02-18"; // change if you want

  return (
    <div className="py-8 px-4">
      <main className="max-w-4xl mx-auto mt-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-500 mb-10">Effective date: {effectiveDate}</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Overview
            </h2>
            <p>
              Biolinkhq (“we”, “us”, “our”) helps you create a public page to
              share links and social profiles. This Privacy Policy explains what
              information we collect, how we use it, and your choices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Account data:</span> If you sign
                in with Google, we receive basic profile info such as your name,
                email, and profile image (as provided by Google).
              </li>
              <li>
                <span className="font-semibold">Content you add:</span> Links,
                buttons, profile details, and settings you choose to publish.
              </li>
              <li>
                <span className="font-semibold">Usage/analytics events:</span>{" "}
                We may record basic events like page views and link clicks to
                provide analytics inside your dashboard.
              </li>
              <li>
                <span className="font-semibold">Technical data:</span> IP
                address, device/browser data, and timestamps for security,
                debugging, and performance.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              How We Use Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide login and account functionality.</li>
              <li>To host and display your public Biolinkhq page.</li>
              <li>To generate analytics (views/clicks) for your links.</li>
              <li>To secure the platform and prevent abuse.</li>
              <li>To improve product performance and user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Sharing
            </h2>
            <p>
              We do not sell your personal information. We may share data only
              in these situations:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <span className="font-semibold">Service providers:</span>{" "}
                Infrastructure/hosting and database providers needed to operate
                the service.
              </li>
              <li>
                <span className="font-semibold">Legal:</span> If required to
                comply with law or protect rights, safety, and security.
              </li>
              <li>
                <span className="font-semibold">Public content:</span> Anything
                you choose to publish on your public page is publicly visible.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Cookies
            </h2>
            <p>
              We use cookies/session storage mainly for authentication and
              security (for example, keeping you signed in). Some analytics may
              rely on cookies as well.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Data Retention
            </h2>
            <p>
              We keep account and page data while your account is active. We may
              retain limited logs/analytics for security and reporting.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Your Choices
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You can edit or remove your links and page content anytime.</li>
              <li>
                You can stop using the service by removing your public content
                and discontinuing sign-in.
              </li>
              <li>
                You can request deletion of your account/data by contacting us
                (see below).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Security
            </h2>
            <p>
              We use reasonable safeguards to protect your data. No method of
              transmission or storage is 100% secure, so we can’t guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Contact
            </h2>
            <p>
              If you have questions or requests about this Privacy Policy,
              contact:{" "}
              <span className="font-semibold">theceosolace</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
