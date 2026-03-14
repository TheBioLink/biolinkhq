export const dynamic = "force-dynamic"

import { connectMongo } from "@/lib/mongo"
import { getLinkedProfileModel } from "@/models/LinkedProfile"

export default async function EsportsPage() {

await connectMongo()

const LinkedProfile = getLinkedProfileModel()

const players = await LinkedProfile
.find({ enabled: true })
.limit(30)
.lean()

return (
<div className="p-10">

<h1 className="text-3xl font-bold mb-8">
Esports Players
</h1>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

{players.map(player => (

<div
key={player.psid}
className="p-5 border border-gray-700 rounded-xl"
>

<h2 className="text-xl font-semibold">
{player.gamerTag || "Unknown"}
</h2>

<p className="text-gray-400">
{player.headline}
</p>

<p className="mt-2">
🎮 {player.primaryGame}
</p>

<p>
🏆 {player.rank}
</p>

<a
href={`/esports/${player.psid}`}
className="text-blue-400 mt-3 block"
>
View Profile
</a>

</div>

))}

</div>

</div>
)
}
