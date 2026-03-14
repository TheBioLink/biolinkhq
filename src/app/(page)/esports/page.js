import Link from "next/link";
import { getLinkedProfileModel } from "@/models/LinkedProfile";
import { statusLabel } from "@/lib/esports-profile";

export default async function EsportsDirectoryPage() {
  const LinkedProfile = await getLinkedProfileModel();

  const players = await LinkedProfile.find({
    enabled: true,
    "privacy.allowSearchIndexing": true,
  })
    .sort({
      featured: -1,
      "trust.profileScore": -1,
      updatedAt: -1,
    })
    .limit(24)
    .lean();

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
            Esports Identity
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Discover players, coaches, managers, and talent
          </h1>
          <p className="mt-3 max-w-3xl text-white/65">
            Privacy-first esports profiles for scouting, team building, and org discovery.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => (
            <Link
              key={player.psid}
              href={`/esports/${player.psid}`}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">
                    {player.gamerTag || `Player ${player.psid}`}
                  </h2>
                  {player.headline ? (
                    <p className="mt-2 text-white/70">{player.headline}</p>
                  ) : null}
                </div>

                {player.teamStatus ? (
                  <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-200">
                    {statusLabel(player.teamStatus)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2 text-sm text-white/75">
                {player.primaryGame ? <p>Game: {player.primaryGame}</p> : null}
                {player.region ? <p>Region: {player.region}</p> : null}
                {player.rank ? <p>Rank: {player.rank}</p> : null}
              </div>

              {player.roles?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {player.roles.slice(0, 4).map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/85"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-white/50">
                  Score: {player?.trust?.profileScore || 0}
                </span>
                <span className="font-bold text-blue-200">View profile</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
