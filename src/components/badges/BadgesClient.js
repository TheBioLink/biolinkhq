"use client";
import { useEffect, useState } from "react";

export default function BadgesClient(){
  const [data,setData]=useState(null);

  async function load(){
    const res = await fetch("/api/badges");
    const d = await res.json();
    setData(d);
  }

  useEffect(()=>{load()},[]);

  if(!data) return null;

  return (
    <div className="space-y-4">
      {data.badges.map(b=>{
        const owned = data.myBadges.find(x=>x.badgeId===b._id);
        return (
          <div key={b._id} className="p-3 border border-white/10 rounded flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={b.icon} className="w-8 h-8" />
              <span>{b.name}</span>
            </div>

            {b.type==="public" && !owned && (
              <button onClick={async()=>{await fetch("/api/badges",{method:"PATCH",body:JSON.stringify({action:"claim",badgeId:b._id})});load();}} className="bg-blue-500 px-2 py-1 rounded">Claim</button>
            )}

            {owned && (
              <button onClick={async()=>{await fetch("/api/badges",{method:"PATCH",body:JSON.stringify({action:"toggle",badgeId:b._id})});load();}} className="bg-white/10 px-2 py-1 rounded">Toggle</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
