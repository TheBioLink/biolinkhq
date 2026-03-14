import mongoose from "mongoose"
import { connectEsportsDB } from "@/lib/mongo"

const LinkedProfileSchema = new mongoose.Schema({

psid: {
type: Number,
required: true,
unique: true,
index: true
},

owner: {
type: String,
required: true,
lowercase: true,
trim: true
},

mainUri: { type: String, default: "" },

enabled: { type: Boolean, default: false },

gamerTag: { type: String, default: "" },

headline: { type: String, default: "" },

primaryGame: { type: String, default: "" },

secondaryGames: {
type: [String],
default: []
},

roles: {
type: [String],
default: []
},

region: { type: String, default: "" },

rank: { type: String, default: "" },

teamStatus: {
type: String,
enum: ["", "lft", "on-team", "fa", "coach", "manager"],
default: ""
},

orgTypeWanted: {
type: [String],
default: []
},

achievements: {
type: [String],
default: []
},

vodLinks: {
type: [String],
default: []
},

availability: { type: String, default: "" },

languages: {
type: [String],
default: []
},

anonymousBio: { type: String, default: "" },

privacy: {

showRealName: { type: Boolean, default: false },

showLocation: { type: Boolean, default: false },

hidePersonalLinks: { type: Boolean, default: true },

contactMode: {
type: String,
enum: ["public", "request-only", "private"],
default: "request-only"
}

}

},{ timestamps:true })

export async function getLinkedProfileModel() {

const conn = await connectEsportsDB()

return conn.models.LinkedProfile ||
conn.model("LinkedProfile", LinkedProfileSchema)

}
