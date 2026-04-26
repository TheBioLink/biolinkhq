"use client";

import { useEffect, useState } from "react";

function slugify(v) {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ArticlesClient() {
  const [articles, setArticles] = useState([]);
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("published");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/articles", { cache: "no-store" });
    const data = await res.json();
    setArticles(data.articles || []);
  }

  useEffect(() => { load(); }, []);

  function reset() {
    setId(""); setTitle(""); setSlug(""); setSubtitle(""); setBannerImage(""); setContent(""); setStatus("published");
  }

  function edit(a) {
    setId(a.id); setTitle(a.title || ""); setSlug(a.slug || ""); setSubtitle(a.subtitle || ""); setBannerImage(a.bannerImage || ""); setContent(a.content || ""); setStatus(a.status || "published");
  }

  async function upload(file) {
    if (!file) return;
    setMessage("Uploading banner...");
    const fileBase64 = await fileToBase64(file);
    const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileBase64, type: "article-banner" }) });
    const data = await res.json();
    if (res.ok) { setBannerImage(data.url); setMessage("Banner uploaded."); }
    else setMessage(data.error || "Upload failed");
  }

  async function save() {
    setSaving(true); setMessage("");
    const payload = { id, title, slug: slug || slugify(title), subtitle, bannerImage, content, status };
    const res = await fetch("/api/articles", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMessage(data.error || "Save failed");
    setMessage(id ? "Article updated." : "Article created.");
    reset(); load();
  }

  async function removeArticle(articleId) {
    const res = await fetch("/api/articles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: articleId }) });
    const data = await res.json();
    setMessage(res.ok ? "Article removed." : data.error || "Remove failed");
    load();
  }

  return (
    <div className="space-y-6">
      {message && <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">{message}</div>}

      <section className="rounded-3xl border border-white/10 bg-[#101827] p-5">
        <h2 className="text-2xl font-black">{id ? "Edit article" : "Create article"}</h2>
        <p className="mt-1 text-sm text-white/50">Banner, title, subtitle and full article text.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input value={title} onChange={(e) => { setTitle(e.target.value); if (!id) setSlug(slugify(e.target.value)); }} placeholder="Title" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
          <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="article-slug" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none md:col-span-2" />
          <input value={bannerImage} onChange={(e) => setBannerImage(e.target.value)} placeholder="Banner URL" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none md:col-span-2" />
          <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none md:col-span-2" />
          {bannerImage && <img src={bannerImage} alt="banner preview" className="h-48 w-full rounded-2xl object-cover md:col-span-2" />}
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} placeholder="Article text" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none md:col-span-2" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || title.trim().length < 2} className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-black disabled:opacity-50">{saving ? "Saving..." : id ? "Update" : "Create"}</button>
            {id && <button onClick={reset} className="rounded-2xl bg-white/10 px-5 py-3 font-black">Cancel</button>}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Articles</h2>
        {articles.length === 0 && <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/45">No articles yet.</div>}
        <div className="grid gap-4 lg:grid-cols-2">
          {articles.map((a) => (
            <article key={a.id} className="rounded-3xl border border-white/10 bg-[#101827] p-5">
              {a.bannerImage && <img src={a.bannerImage} alt="" className="mb-4 h-32 w-full rounded-2xl object-cover" />}
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">{a.status}</div>
              <h3 className="mt-2 text-lg font-black">{a.title}</h3>
              <p className="mt-1 text-sm text-white/50">{a.subtitle}</p>
              <div className="mt-4 flex gap-2">
                <a href={`/news/${a.slug}`} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">View</a>
                <button onClick={() => edit(a)} className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-bold text-blue-200">Edit</button>
                <button onClick={() => removeArticle(a.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200">Remove</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
