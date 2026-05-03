export const metadata = {
  title: "Biolinkhq.lol | Privacy Policy",
  description: "Privacy policy for Biolinkhq.lol by itsnicbtw",
};

export default function PrivacyPage() {
  const effectiveDate = "2026-05-03";

  return (
    <div className="py-8 px-4">
      <main className="max-w-4xl mx-auto mt-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Privacy Policy
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
              Biolinkhq.lol (“Biolinkhq”, “we”, “us”, or “our”) is a platform
              that allows users to create public bio pages, join teams,
              communicate through messaging systems, and participate in
              moderated communities. This Privacy Policy explains how we
              collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Information We Collect
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Account information:</span>{" "}
                Name, email, and profile image when signing in via OAuth
                providers (e.g. Google).
              </li>

              <li>
                <span className="font-semibold">Profile content:</span> Links,
                bios, images, and settings you publish on your public page.
              </li>

              <li>
                <span className="font-semibold">Team data:</span> Information
                related to teams you join or create, including roles,
                memberships, and team activity.
              </li>

              <li>
                <span className="font-semibold">Messaging data:</span> Messages
                sent through our internal messaging system, including content,
                timestamps, and recipient information.
              </li>

              <li>
                <span className="font-semibold">Moderation data:</span> Reports,
                flagged content, enforcement actions, and moderation logs used
                to keep the platform safe.
              </li>

              <li>
                <span className="font-semibold">Usage data:</span> Page views,
                clicks, and feature interactions for analytics and improvement.
              </li>

              <li>
                <span className="font-semibold">Technical data:</span> IP
                address, device type, browser information, and timestamps.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              How We Use Information
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>To provide accounts, authentication, and user profiles.</li>
              <li>To operate public Biolink pages and team features.</li>
              <li>To enable messaging between users and teams.</li>
              <li>To moderate content and enforce platform rules.</li>
              <li>To generate analytics and improve platform features.</li>
              <li>To detect abuse, spam, and security threats.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Teams, Messaging & Moderation
            </h2>

            <p>
              Biolinkhq.lol now includes collaborative features such as teams,
              internal messaging, and moderation systems.
            </p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <span className="font-semibold">Teams:</span> Content and
                activity inside teams may be visible to other members of that
                team depending on roles and permissions.
              </li>

              <li>
                <span className="font-semibold">Messaging:</span> Messages are
                delivered to intended recipients and may be processed for spam
                detection, abuse prevention, and platform safety.
              </li>

              <li>
                <span className="font-semibold">Moderation:</span> We may
                review, flag, or remove content that violates our policies.
                Moderation actions may be logged for safety and enforcement
                purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Data Sharing
            </h2>

            <p>We do not sell personal data.</p>

            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <span className="font-semibold">Service providers:</span>{" "}
                Infrastructure, hosting, and database providers.
              </li>

              <li>
                <span className="font-semibold">Legal compliance:</span> If
                required by law or to protect users and platform integrity.
              </li>

              <li>
                <span className="font-semibold">Public content:</span> Content
                you choose to publish publicly is visible to anyone.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Cookies & Sessions
            </h2>
            <p>
              We use cookies and sessions for authentication, security, and
              maintaining user sessions across the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Data Retention
            </h2>
            <p>
              We retain data while your account is active. Some logs,
              moderation records, and analytics may be stored longer for
              security and legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Your Rights & Choices
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Edit or delete your content at any time.</li>
              <li>Leave or delete teams you are part of.</li>
              <li>Control messaging interactions through settings or blocking.</li>
              <li>Request deletion of your account and associated data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Security
            </h2>
            <p>
              We implement reasonable security measures to protect user data,
              but no system is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Contact
            </h2>
            <p>
              For privacy concerns or data requests, contact:{" "}
              <span className="font-semibold">support@biolinkhq.lol</span>
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
