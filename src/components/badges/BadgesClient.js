"use client";
import { useEffect, useState } from "react";

export default function BadgesClient(){
  const [data,setData]=useState(null);
  const [name,setName]=useState("");
  const [type,setType]=useState("public");

  async function load(){
    const res = await fetch("/api/badges");
    const d = await res.json();
    console.log("BADGES:", d);
    setData(d);
  }

  async function createBadge(){
    await fetch("/api/badges",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ name, type })
    });
    setName("");
    load();
  }

  useEffect(()=>{load()},[]);

  if(!data) return <div className="text-white/40">Loading badges...</div>;

  return (
    <div className="space-y-6">

      {data.isAdmin && (
        <div className="p-4 border border-white/10 rounded space-y-3">
          <h2 className="font-bold">Create Badge</h2>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Badge name" className="w-full bg-black/30 p-2 rounded" />
          <select value={type} onChange={e=>setType(e.target.value)} className="w-full bg-black/30 p-2 rounded">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button onClick={createBadge} className="bg-blue-500 px-3 py-2 rounded">Create</button>
        </div>
      )}

      {!data.badges?.length && (
        <div className="text-white/40">No badges yet.</div>
      )}

      {data.badges?.map(b=>{
        const owned = data.myBadges.find(x=>String(x.badgeId)===String(b._id));

        return (
          <div key={b._id} className="p-3 border border-white/10 rounded flex justify-between items-center">
            <div className="flex items-center gap-3">
              {b.icon && <img src={b.icon} className="w-8 h-8" />}
              <span>{b.name}</span>
            </div>

            {b.type==="public" && !owned && (
              <button onClick={async()=>{await fetch("/api/badges",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"claim",badgeId:b._id})});load();}} className="bg-blue-500 px-2 py-1 rounded">Claim</button>
            )}

            {owned && (
              <button onClick={async()=>{await fetch("/api/badges",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"toggle",badgeId:b._id})});load();}} className="bg-white/10 px-2 py-1 rounded">Toggle</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
