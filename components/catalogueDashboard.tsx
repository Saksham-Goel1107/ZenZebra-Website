"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { getDownloadURL, ref as sRef, uploadBytes } from "firebase/storage";
import { signOut } from "firebase/auth";
import { db, storage, auth } from "@/firebase";

type Row = {
  id: string;
  label: string;
  url: string;
  active: boolean;
  updatedAt?: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CatalogueDashboard() {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // NEW: ref to clear file input UI
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    console.log("currentUser UID (mount):", auth.currentUser?.uid || null);
  }, []);

  useEffect(() => {
    const r = ref(db, "catalog/locations");
    const off = onValue(r, (snap) => {
      const v = snap.val() || {};
      const list: Row[] = Object.entries(v).map(([id, o]: any) => ({
        id,
        label: o.label ?? "",
        url: o.url ?? "",
        active: !!o.active,
        updatedAt: o.updatedAt ?? 0,
      }));
      list.sort((a, b) => a.label.localeCompare(b.label));
      setRows(list);
    });
    return () => off();
  }, []);

  const resetForm = () => {
    setLabel("");
    setUrl("");
    setActive(true);
    setFile(null);
    setEditingId(null);
    // NEW: clear the file input's displayed filename
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadPdfIfAny = async (locLabel: string): Promise<string> => {
    if (!file) return url.trim();

    const isPdfByType = (file.type || "").toLowerCase().includes("pdf");
    const isPdfByName = /\.pdf$/i.test(file.name);
    if (!isPdfByType && !isPdfByName)
      throw new Error("Please upload a PDF file (.pdf).");
    if (file.size > 20 * 1024 * 1024)
      throw new Error("PDF must be 20 MB or smaller.");

    console.log("UID before upload:", auth.currentUser?.uid || null, {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const key = `${Date.now()}-${slugify(locLabel)}`;
    const path = `catalog/${key}.pdf`;
    const contentType =
      file.type && file.type !== "application/octet-stream"
        ? file.type
        : "application/pdf";

    const sr = sRef(storage, path);
    await uploadBytes(sr, file, { contentType });
    const dl = await getDownloadURL(sr);
    return dl;
  };

  const handleSave = async () => {
    if (!label.trim()) return alert("Please enter location label.");
    setBusy(true);
    try {
      const finalUrl = await uploadPdfIfAny(label);
      if (!finalUrl) return alert("Provide a URL or upload a PDF.");

      if (editingId) {
        await update(ref(db, `catalog/locations/${editingId}`), {
          label: label.trim(),
          url: finalUrl,
          active,
          updatedAt: Date.now(),
        });
      } else {
        const r = push(ref(db, "catalog/locations"));
        await set(r, {
          label: label.trim(),
          url: finalUrl,
          active,
          updatedAt: Date.now(),
        });
      }
      resetForm();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row: Row) => {
    setEditingId(row.id);
    setLabel(row.label);
    setUrl(row.url);
    setActive(row.active);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (row: Row) => {
    if (!confirm(`Delete "${row.label}"? This cannot be undone.`)) return;
    await remove(ref(db, `catalog/locations/${row.id}`));
    if (editingId === row.id) resetForm();
  };

  const logout = async () => {
    await signOut(auth);
    router.replace("/admin-login");
  };

  const canSave = useMemo(
    () => !!label.trim() && (!!url.trim() || !!file),
    [label, url, file]
  );

  return (
    <section className="min-h-screen bg-[#0A0A0A] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Catalogue Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-md bg-white/10 border border-white/10"
          >
            Sign out
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Location" : "Add New Location"}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">Location label</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Awfis – Ambience Mall, Gurugram"
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">
                PDF URL (optional if you upload)
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…/catalog.pdf"
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-white/70">
                Upload PDF (optional)
              </span>
              <input
                ref={fileInputRef} // <-- attach ref
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2"
              />
            </label>

            <label className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span className="text-white/80">Active</span>
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              disabled={!canSave || busy}
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-[#CC2224] disabled:bg-[#CC2224]/40"
            >
              {editingId
                ? busy
                  ? "Saving…"
                  : "Update"
                : busy
                ? "Saving…"
                : "Add"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-5 py-2 rounded-lg bg-white/10 border border-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.06]">
              <tr className="text-left">
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">PDF URL</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{r.label}</td>
                  <td className="px-4 py-3 max-w-[320px] truncate">
                    <a
                      href={r.url}
                      target="_blank"
                      className="text-[#CC2224] underline"
                    >
                      {r.url}
                    </a>
                  </td>
                  <td className="px-4 py-3">{r.active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="px-3 py-1 rounded bg-white/10 border border-white/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      className="px-3 py-1 rounded bg-[#CC2224]/80"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-white/60"
                  >
                    No locations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}