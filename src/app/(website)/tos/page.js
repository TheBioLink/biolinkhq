export const metadata = {
  title: "Biolinkhq.lol | Terms of Service",
  description: "Terms of Service for Biolinkhq.lol by itsnicbtw",
};

export default function TermsPage() {
  const effectiveDate = "2026-05-03";

  return (
    <div className="py-8 px-4">
      <main className="max-w-4xl mx-auto mt-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Terms of Service
        </h1>

        <p className="text-gray-500 mb-10">
          Effective date: {effectiveDate}
        </p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Overview
            </h2>
            <p>
              These Terms of Service (“Terms”) govern your access to and use of
              Biolinkhq.lol (“Biolinkhq”, “we”, “us”, or “our”). By using the
              platform, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Description of Service
            </h2>
            <p>
              Biolinkhq.lol allows users to create public bio pages, share
              links, join or create teams, communicate via messaging systems,
              and participate in moderated communities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              User Accounts
            </h2>
            <p>
              You are responsible for maintaining the security of your account
              and any activity under it. You must provide accurate information
              and not impersonate others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              User Content
            </h2>
            <p>
              You retain ownership of content you create, but you grant
              Biolinkhq a non-exclusive license to host, display, and operate
              your content as part of the service.
            </p>
            <p className="mt-2">
              You are solely responsible for the content you publish.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Teams, Messaging & Communities
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Teams are collaborative spaces where content may be shared
                between members based on roles and permissions.
              </li>
              <li>
                Messaging features allow communication between users and may be
                monitored for spam, abuse, or security purposes.
              </li>
              <li>
                Community spaces are subject to moderation and enforcement of
                platform rules.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Acceptable Use
            </h2>
            <p>You agree not to use Biolinkhq.lol to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Post illegal, harmful, or abusive content.</li>
              <li>Harass, threaten, or impersonate others.</li>
              <li>Send spam or unsolicited messages.</li>
              <li>Attempt to exploit, hack, or disrupt the platform.</li>
              <li>Bypass moderation systems or security controls.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Moderation & Enforcement
            </h2>
            <p>
              We reserve the right to review, remove, or restrict content that
              violates these Terms or harms the platform or its users.
            </p>
            <p className="mt-2">
              This may include warnings, content removal, suspension, or
              permanent bans.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Termination
            </h2>
            <p>
              We may suspend or terminate your access at any time if you violate
              these Terms or misuse the platform. You may also stop using the
              service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Availability
            </h2>
            <p>
              We do not guarantee uninterrupted access to the service. Features
              may change, be updated, or temporarily unavailable at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Disclaimer
            </h2>
            <p>
              The service is provided “as is” without warranties of any kind.
              We do not guarantee accuracy, reliability, or availability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Limitation of Liability
            </h2>
            <p>
              Biolinkhq.lol is not liable for any indirect, incidental, or
              consequential damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Changes to Terms
            </h2>
            <p>
              We may update these Terms from time to time. Continued use of the
              platform means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Contact
            </h2>
            <p>
              For questions about these Terms, contact:{" "}
              <span className="font-semibold">support@biolinkhq.lol</span>
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
