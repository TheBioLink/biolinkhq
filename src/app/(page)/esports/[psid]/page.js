import mongoose from "mongoose";
import { User } from "@/models/User";
import { getLinkedProfileModel } from "@/models/LinkedProfile";
import { statusLabel } from "@/lib/esports-profile";

function notFoundScreen() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-black">Not found</h1>
        <p className="mt-3 text-white/70">This esports identity does not exist.</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function EsportsProfilePage({ params }) {
  const psid = Number(params?.psid);

  if (!Number.isFinite(psid)) return notFoundScreen();

  await mongoose.connect(process.env.MONGO_URI);
  const LinkedProfile = await getLinkedProfileModel();

  const profile = await LinkedProfile.findOne({ psid, enabled: true }).lean();
  if (!profile) return notFoundScreen();

  const user = await User.findOne({ psid }).lean();

  await LinkedProfile.updateOne(
    { psid },
    { $inc: { "metrics.profileViews": 1 } }
  );

  const titleName = profile.gamerTag || user?.name || `Player ${profile.psid}`;
  const realName =
    profile?.privacy?.showRealName && user?.name ? user.name : null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
                Esports Identity
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">{titleName}</h1>

              {realName ? (
                <p className="mt-2 text-white/60">{realName}</p>
              ) : null}

              {profile.headline ? (
                <p className="mt-3 max-w-2xl text-lg text-blue-100/90">{profile.headline}</p>
              ) : null}
            </div>

            <div className="flex flex-col items-start gap-3">
              {profile.teamStatus ? (
                <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-sm font-extrabold text-blue-200">
                  {statusLabel(profile.teamStatus)}
                </span>
              ) : null}

              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80">
                Profile score: {profile?.trust?.profileScore || 0}
              </span>

              <button
                type="button"
                className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white/75"
              >
                Messaging coming soon
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {profile.primaryGame ? <div className="rounded-2xl bg-black/20 p-4">Game: {profile.primaryGame}</div> : null}
            {profile.region ? <div className="rounded-2xl bg-black/20 p-4">Region: {profile.region}</div> : null}
            {profile.rank ? <div className="rounded-2xl bg-black/20 p-4">Rank: {profile.rank}</div> : null}
            {profile.peakRank ? <div className="rounded-2xl bg-black/20 p-4">Peak: {profile.peakRank}</div> : null}
          </div>

          {profile.anonymousBio ? (
            <div className="mt-6 rounded-2xl bg-black/20 p-5">
              <p className="text-sm leading-7 text-white/85">{profile.anonymousBio}</p>
            </div>
          ) : null}

          {profile.roles?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-white/90"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {profile.orgFitTags?.length ? (
          <Section title="Org fit">
            <div className="flex flex-wrap gap-2">
              {profile.orgFitTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        ) : null}

        {profile.strengths?.length ? (
          <Section title="Strengths">
            <div className="flex flex-wrap gap-2">
              {profile.strengths.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-white/85"
                >
                  {item}
                </span>
              ))}
            </div>
          </Section>
        ) : null}

        {profile.achievements?.length ? (
          <Section title="Achievements">
            <div className="space-y-3">
              {profile.achievements.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/90"
                >
                  {item}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {profile.tournamentHistory?.length ? (
          <Section title="Tournament history">
            <div className="space-y-3">
              {profile.tournamentHistory.map((item, index) => (
                <div
                  key={`${item.event}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="font-bold text-white">{item.event || "Tournament"}</div>
                  <div className="mt-1 text-sm text-white/65">
                    {item.placement || "Placement not listed"}
                    {item.year ? ` • ${item.year}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {profile.vodLinks?.length ? (
          <Section title="Featured VODs">
            <div className="space-y-3">
              {profile.vodLinks.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/90 hover:bg-white/10"
                >
                  {link}
                </a>
              ))}
            </div>
          </Section>
        ) : null}

        {(profile.socials?.x || profile.socials?.twitch || profile.socials?.youtube || profile.socials?.discord) ? (
          <Section title="Socials">
            <div className="grid gap-3 md:grid-cols-2">
              {profile.socials?.x ? <a href={profile.socials.x} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">X / Twitter</a> : null}
              {profile.socials?.twitch ? <a href={profile.socials.twitch} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">Twitch</a> : null}
              {profile.socials?.youtube ? <a href={profile.socials.youtube} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">YouTube</a> : null}
              {profile.socials?.discord ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">Discord: {profile.socials.discord}</div> : null}
            </div>
          </Section>
        ) : null}

        {profile?.privacy?.showMainProfileLink && profile.mainUri ? (
          <section className="mt-6">
            <a
              href={`/${profile.mainUri}`}
              className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white hover:bg-white/10"
            >
              View main BioLink profile
            </a>
          </section>
        ) : null}
      </div>
    </div>
  );
}
