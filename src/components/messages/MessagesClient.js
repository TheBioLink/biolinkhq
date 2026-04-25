"use client";

import { useState, useEffect } from "react";

export default function MessagesClient() {
  const [target, setTarget] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function load() {
    if (!target) return;
    const res = await fetch(`/api/messages?with=${target}`);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  async function send() {
    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ toEmail: target, body: text }),
    });
    setText("");
    load();
  }

  useEffect(() => {
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, [target]);

  return (
    <div>
      <input value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="User email"/>
      <div>
        {messages.map(m => <div key={m._id}><b>{m.fromEmail}:</b> {m.body}</div>)}
      </div>
      <input value={text} onChange={(e)=>setText(e.target.value)}/>
      <button onClick={send}>Send</button>
    </div>
  );
}
