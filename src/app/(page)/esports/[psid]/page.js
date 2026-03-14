export const dynamic = "force-dynamic"

import { connectMongo } from "@/lib/mongo"
import { getLinkedProfileModel } from "@/models/LinkedProfile"

export default async function EsportsProfile({ params }) {

await connectMongo()

const LinkedProfile = getLinkedProfileModel()

const profile = await LinkedProfile
.findOne({ psid: Number(params.psid) })
.lean()

if (!profile) {
return <div className="p-10">Profile not found</div>
}

return (
<div className="p-10 max-w-3xl mx-auto">

<h1 className="text-4xl font-bold">
{profile.gamerTag}
</h1>

<p className="text-gray-400 mt-2">
{profile.headline}
</p>

<div className="mt-6 space-y-2">

<p>
🎮 Game: {profile.primaryGame}
</p>

<p>
🏆 Rank: {profile.rank}
</p>

<p>
🌍 Region: {profile.region}
</p>

<p>
🎯 Roles: {profile.roles?.join(", ")}
</p>

<p>
📢 Status: {profile.teamStatus}
</p>

</div>

{profile.anonymousBio && (
<p className="mt-6">
{profile.anonymousBio}
</p>
)}

</div>
)
}
