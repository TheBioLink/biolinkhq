// src/hooks/useDashboardDraft.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export default function useDashboardDraft(initialState) {
  const initialRef = useRef(initialState);
  const [draft, setDraft] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    initialRef.current = initialState;
    setDraft(initialState);
  }, [stableStringify(initialState)]);

  const hasChanges = useMemo(() => {
    return stableStringify(draft) !== stableStringify(initialRef.current);
  }, [draft]);

  useEffect(() => {
    if (hasChanges) setSaved(false);
  }, [hasChanges]);

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function update(updater) {
    setDraft((prev) => updater(prev));
  }

  function reset() {
    setDraft(initialRef.current);
    setSaved(false);
  }

  function markSaved(nextState) {
    initialRef.current = nextState;
    setDraft(nextState);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return {
    draft,
    setDraft,
    updateField,
    update,
    reset,
    hasChanges,
    saving,
    setSaving,
    saved,
    setSaved,
    markSaved,
  };
}
