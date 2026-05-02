// src/app/api/discord-chat/servers/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDiscordServerModel } from "@/models/DiscordServer";
import { getDiscordChannelModel } from "@/models/DiscordChannel";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || `server-${Date.now()}`;
}

async function connectMainDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function getSessionPage(session) {
  if (!session?.user?.email) return null;
  await connectMainDb();
  return Page.findOne({ owner: norm(session.user.email) }).lean();
}

function isItsNic(email, uri) {
  return norm(email) === "mrrunknown44@gmail.com" || norm(uri) === "itsnicbtw";
}

function serializeServer(server, myEmail = "") {
  const me = server.members?.find((m) => norm(m.email) === norm(myEmail));
  return {
    id: String(server._id),
    name: server.name,
    slug: server.slug,
    description: server.description || "",
    icon: server.icon || "",
    ownerUri: server.ownerUri || "",
    isGlobal: server.isGlobal || false,
    isPublic: server.isPublic !== false,
    memberCount: (server.members || []).length,
    myRole: me?.role || null,
    isMember: !!me,
    createdAt: server.createdAt,
  };
}

// ── Ensure global BioLinkHQ server exists ────────────────────────────────────
async function ensureGlobalServer(Server) {
  let global = await Server.findOne({ slug: "biolinkhq" }).lean();
  if (!global) {
    global = await Server.create({
      name: "BioLinkHQ",
      slug: "biolinkhq",
      description: "The official BioLinkHQ community server — everyone is here.",
      ownerEmail: "mrrunknown44@gmail.com",
      ownerUri: "itsnicbtw",
      isGlobal: true,
      isPublic: true,
      order: -1,
      members: [
        {
          email: "mrrunknown44@gmail.com",
          uri: "itsnicbtw",
          role: "owner",
          joinedAt: new Date(),
        },
      ],
    });
    // Also seed a #general channel for this server
    try {
      const Channel = await getDiscordChannelModel();
      const exists = await Channel.findOne({ serverSlug: "biolinkhq" }).lean();
      if (!exists) {
        await Channel.create({
          name: "general",
          slug: "general",
          serverSlug: "biolinkhq",
          description: "General chat for everyone",
          emoji: "💬",
          isDefault: true,
          order: 0,
          createdBy: "system",
        });
      }
    } catch {}
  }
  return global;
}

// ── Auto-join global server ──────────────────────────────────────────────────
async function ensureGlobalMembership(Server, email, uri) {
  if (!email) return;
  await Server.updateOne(
    {
      slug: "biolinkhq",
      "members.email": { $ne: norm(email) },
    },
    {
      $push: {
        members: {
          email: norm(email),
          uri: norm(uri),
          role: "member",
          joinedAt: new Date(),
        },
      },
    }
  );
}

// ── GET /api/discord-chat/servers ────────────────────────────────────────────
// Returns: global server + servers the user is a member of
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getSessionPage(session);
  const myEmail = norm(session.user.email);
  const myUri = page?.uri || "";

  try {
    const Server = await getDiscordServerModel();

    // Ensure global server exists and user is a member
    await ensureGlobalServer(Server);
    await ensureGlobalMembership(Server, myEmail, myUri);

    // Fetch all servers user is a member of
    const servers = await Server.find({
      $or: [
        { isGlobal: true },
        { "members.email": myEmail },
      ],
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Fetch pending invites for this user
    const pendingInvites = await Server.find({
      "invites.toEmail": myEmail,
      "invites.status": "pending",
    })
      .select("name slug icon ownerUri invites")
      .lean();

    const invites = pendingInvites.flatMap((s) =>
      (s.invites || [])
        .filter((inv) => norm(inv.toEmail) === myEmail && inv.status === "pending")
        .map((inv) => ({
          serverId: String(s._id),
          serverName: s.name,
          serverSlug: s.slug,
          serverIcon: s.icon || "",
          invitedBy: inv.invitedBy || "",
          inviteId: String(inv._id),
        }))
    );

    return NextResponse.json({
      ok: true,
      servers: servers.map((s) => serializeServer(s, myEmail)),
      invites,
    });
  } catch (error) {
    console.error("Servers GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load servers" }, { status: 500 });
  }
}

// ── POST /api/discord-chat/servers ───────────────────────────────────────────
// action: "create" | "join" | "leave" | "invite" | "respond_invite" | "delete"
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getSessionPage(session);
  const myEmail = norm(session.user.email);
  const myUri = page?.uri || "";
  const admin = isItsNic(myEmail, myUri);

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();
    const Server = await getDiscordServerModel();

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (action === "create") {
      const name = String(body.name || "").trim().slice(0, 64);
      if (!name || name.length < 2) {
        return NextResponse.json({ error: "Server name must be at least 2 characters" }, { status: 400 });
      }

      const slug = slugify(body.slug || name);

      const existing = await Server.findOne({ slug }).lean();
      if (existing) {
        return NextResponse.json({ error: "A server with that name already exists" }, { status: 409 });
      }

      const server = await Server.create({
        name,
        slug,
        description: String(body.description || "").trim().slice(0, 256),
        icon: String(body.icon || "").trim().slice(0, 8), // emoji or URL
        ownerEmail: myEmail,
        ownerUri: myUri,
        isGlobal: false,
        isPublic: body.isPublic !== false,
        members: [
          { email: myEmail, uri: myUri, role: "owner", joinedAt: new Date() },
        ],
      });

      // Seed a #general channel for new server
      try {
        const Channel = await getDiscordChannelModel();
        await Channel.create({
          name: "general",
          slug: "general",
          serverSlug: slug,
          description: "General chat",
          emoji: "💬",
          isDefault: true,
          order: 0,
          createdBy: myEmail,
        });
      } catch {}

      return NextResponse.json({ ok: true, server: serializeServer(server.toObject(), myEmail) });
    }

    // ── JOIN (public servers) ────────────────────────────────────────────────
    if (action === "join") {
      const serverSlug = norm(body.serverSlug);
      const server = await Server.findOne({ slug: serverSlug });
      if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
      if (!server.isPublic && !admin) {
        return NextResponse.json({ error: "This server is invite-only" }, { status: 403 });
      }
      if (server.isGlobal) {
        return NextResponse.json({ error: "You are already in this server" }, { status: 409 });
      }

      const alreadyMember = (server.members || []).some((m) => norm(m.email) === myEmail);
      if (!alreadyMember) {
        server.members.push({ email: myEmail, uri: myUri, role: "member", joinedAt: new Date() });
        await server.save();
      }

      return NextResponse.json({ ok: true });
    }

    // ── LEAVE ────────────────────────────────────────────────────────────────
    if (action === "leave") {
      const serverSlug = norm(body.serverSlug);
      const server = await Server.findOne({ slug: serverSlug });
      if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
      if (server.isGlobal) {
        return NextResponse.json({ error: "You cannot leave the global BioLinkHQ server" }, { status: 403 });
      }
      if (norm(server.ownerEmail) === myEmail) {
        return NextResponse.json({ error: "Transfer ownership before leaving" }, { status: 400 });
      }

      server.members = (server.members || []).filter((m) => norm(m.email) !== myEmail);
      await server.save();
      return NextResponse.json({ ok: true });
    }

    // ── INVITE ───────────────────────────────────────────────────────────────
    if (action === "invite") {
      const serverSlug = norm(body.serverSlug);
      const targetUri = norm(body.targetUri);

      const server = await Server.findOne({ slug: serverSlug });
      if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

      // Check inviter is owner or admin of this server
      const myRole = (server.members || []).find((m) => norm(m.email) === myEmail)?.role;
      if (!["owner", "admin"].includes(myRole) && !admin) {
        return NextResponse.json({ error: "Only the server owner or admins can invite" }, { status: 403 });
      }

      // Lookup target user
      await connectMainDb();
      const targetPage = await Page.findOne({ uri: targetUri }).lean();
      if (!targetPage?.owner) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const targetEmail = norm(targetPage.owner);

      // Already a member?
      const alreadyMember = (server.members || []).some((m) => norm(m.email) === targetEmail);
      if (alreadyMember) {
        return NextResponse.json({ error: "User is already a member" }, { status: 409 });
      }

      // Pending invite?
      const pendingInvite = (server.invites || []).some(
        (inv) => norm(inv.toEmail) === targetEmail && inv.status === "pending"
      );
      if (pendingInvite) {
        return NextResponse.json({ error: "User already has a pending invite" }, { status: 409 });
      }

      server.invites.push({
        toEmail: targetEmail,
        toUri: targetUri,
        invitedBy: myEmail,
        invitedAt: new Date(),
        status: "pending",
      });
      await server.save();

      return NextResponse.json({ ok: true });
    }

    // ── RESPOND TO INVITE ────────────────────────────────────────────────────
    if (action === "respond_invite") {
      const serverSlug = norm(body.serverSlug);
      const inviteId = String(body.inviteId || "");
      const accept = Boolean(body.accept);

      const server = await Server.findOne({ slug: serverSlug });
      if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

      const invite = (server.invites || []).id(inviteId);
      if (!invite || norm(invite.toEmail) !== myEmail || invite.status !== "pending") {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
      }

      invite.status = accept ? "accepted" : "declined";

      if (accept) {
        const alreadyMember = (server.members || []).some((m) => norm(m.email) === myEmail);
        if (!alreadyMember) {
          server.members.push({ email: myEmail, uri: myUri, role: "member", joinedAt: new Date() });
        }
      }

      await server.save();
      return NextResponse.json({ ok: true });
    }

    // ── DELETE (admin or owner only) ─────────────────────────────────────────
    if (action === "delete") {
      const serverSlug = norm(body.serverSlug);
      const server = await Server.findOne({ slug: serverSlug });
      if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });
      if (server.isGlobal) {
        return NextResponse.json({ error: "Cannot delete the global server" }, { status: 403 });
      }
      if (norm(server.ownerEmail) !== myEmail && !admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await Server.deleteOne({ slug: serverSlug });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Servers POST error:", error);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
