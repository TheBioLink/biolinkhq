import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/libs/cloudinary";
import { getBadgeModels } from "@/models/Badge";
import { Page } from "@/models/Page";

function norm(s){return (s||"").toLowerCase().trim();}

export async function GET(req){
  const session = await getServerSession(authOptions);
  if(!session?.user?.email) return NextResponse.json({error:"Unauthorized"},{status:401});

  const { BadgeModel, UserBadgeModel } = await getBadgeModels();

  const me = norm(session.user.email);

  const page = await Page.findOne({ owner: me }).lean();
  const isAdmin = page?.uri === "itsnicbtw";

  const badges = await BadgeModel.find().lean();
  const myBadges = await UserBadgeModel.find({ ownerEmail: me }).lean();

  return NextResponse.json({ badges, myBadges, isAdmin });
}

export async function POST(req){
  const session = await getServerSession(authOptions);
  if(!session?.user?.email) return NextResponse.json({error:"Unauthorized"},{status:401});

  const { BadgeModel, UserBadgeModel } = await getBadgeModels();

  const me = norm(session.user.email);
  const page = await Page.findOne({ owner: me }).lean();
  if(page?.uri !== "itsnicbtw") return NextResponse.json({error:"Forbidden"},{status:403});

  const body = await req.json();
  const { name, iconBase64, type, assignTo } = body;

  let iconUrl = "";

  if(iconBase64){
    const upload = await cloudinary.uploader.upload(iconBase64, { folder:"biolinkhq_badges" });
    iconUrl = upload.secure_url;
  }

  const badge = await BadgeModel.create({ name, icon: iconUrl, type, createdBy: me });

  if(type === "private" && assignTo){
    const target = await Page.findOne({ uri: assignTo }).lean();
    if(target){
      await UserBadgeModel.create({ badgeId: badge._id, ownerEmail: norm(target.owner) });
    }
  }

  return NextResponse.json({ ok:true, badge });
}

export async function PATCH(req){
  const session = await getServerSession(authOptions);
  if(!session?.user?.email) return NextResponse.json({error:"Unauthorized"},{status:401});

  const { BadgeModel, UserBadgeModel } = await getBadgeModels();
  const me = norm(session.user.email);

  const { action, badgeId } = await req.json();

  if(action === "claim"){
    await UserBadgeModel.updateOne({ badgeId, ownerEmail: me }, { $setOnInsert:{ visible:true } }, { upsert:true });
    return NextResponse.json({ ok:true });
  }

  if(action === "toggle"){
    const badge = await UserBadgeModel.findOne({ badgeId, ownerEmail: me });
    if(badge){
      badge.visible = !badge.visible;
      await badge.save();
    }
    return NextResponse.json({ ok:true });
  }

  return NextResponse.json({ ok:false });
}
