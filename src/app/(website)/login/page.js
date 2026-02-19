import LoginWithGoogle from "@/components/buttons/LoginWithGoogle";

export const metadata = {
  title: "Biolinkhq by theceosolace | Login",
  description:
    "Share your links, social profiles, contact info and more on one page with Biolinkhq",
};

export default function LoginPage({ searchParams }) {
  const error = searchParams?.error;
  const reasonParam = searchParams?.reason;

  const bannedReason =
    error === "banned"
      ? decodeURIComponent((reasonParam || "Banned").toString())
      : "";

  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-4xl font-extrabold text-center mb-2">Sign In</h1>

          <p className="text-center mb-6 text-gray-400">
            Sign in to your account using one of the methods below
          </p>

          {/* ✅ Banned message */}
          {bannedReason && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="font-extrabold text-red-200">
                You are banned from Biolinkhq
              </div>
              <div className="text-sm text-gray-200 mt-1">
                Reason: <span className="font-semibold">{bannedReason}</span>
              </div>
            </div>
          )}

          <LoginWithGoogle />
        </div>
      </div>
    </div>
  );
}
