// src/components/dashboard/AccountEditor.js
"use client";

import { useMemo, useState } from "react";
import PageSettingsForm from "@/components/forms/PageSettingsForm";
import PageButtonsForm from "@/components/forms/PageButtonsForm";
import PageLinksForm from "@/components/forms/PageLinksForm";
import DashboardSaveBar from "@/components/DashboardSaveBar";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export default function AccountEditor({ page, user }) {
  const initialDraft = useMemo(
    () => ({
      ...page,
      buttons: Array.isArray(page?.buttons) ? page.buttons : [],
      links: Array.isArray(page?.links) ? page.links : [],
    }),
    [page]
  );

  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges = stableStringify(draft) !== stableStringify(initialDraft);

  function updateDraft(updater) {
    setDraft((prev) =>
      typeof updater === "function" ? updater(prev) : { ...prev, ...updater }
    );
    setSaved(false);
  }

  function resetDraft() {
    setDraft(initialDraft);
    setSaved(false);
  }

  async function saveChanges() {
    if (!hasChanges || saving) return;

    try {
      setSaving(true);

      const res = await fetch("/api/page", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        setSaving(false);
        return;
      }

      const data = await res.json();
      const nextPage = data?.page || draft;

      setDraft({
        ...nextPage,
        buttons: Array.isArray(nextPage?.buttons) ? nextPage.buttons : [],
        links: Array.isArray(nextPage?.links) ? nextPage.links : [],
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Profile</h2>
          <a
            href={`/${draft.uri}`}
            className="text-sm text-blue-400 underline hover:text-blue-300"
          >
            View public page →
          </a>
        </div>

        <PageSettingsForm
          page={draft}
          user={user}
          draft={draft}
          setDraft={setDraft}
          updateDraft={updateDraft}
          disableInternalSave
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-3 text-xl font-extrabold">Buttons</h2>
        <p className="mb-6 text-sm text-gray-400">
          Small circular icons shown under your bio.
        </p>

        <PageButtonsForm
          page={draft}
          draft={draft}
          setDraft={setDraft}
          updateDraft={updateDraft}
          disableInternalSave
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-3 text-xl font-extrabold">Links</h2>
        <p className="mb-6 text-sm text-gray-400">
          Clickable cards displayed on your public page.
        </p>

        <PageLinksForm
          page={draft}
          draft={draft}
          setDraft={setDraft}
          updateDraft={updateDraft}
          disableInternalSave
        />
      </section>

      <DashboardSaveBar
        visible={hasChanges || saving || saved}
        saving={saving}
        saved={saved}
        onSave={saveChanges}
        onReset={resetDraft}
      />
    </>
  );
}
