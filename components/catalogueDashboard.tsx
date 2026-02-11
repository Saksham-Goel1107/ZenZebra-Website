'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appwriteConfig, default as client, databases, storage } from '@/lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { CheckCircle2, Edit2, FileUp, Loader2, Trash2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from "sonner";

type Row = {
  id: string;
  label: string;
  url: string;
  active: boolean;
  $updatedAt?: string;
  $createdAt?: string;
};

export default function CatalogueDashboard() {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([]);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; row: Row | null }>({ isOpen: false, row: null });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const fetchLocations = async () => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.locationsCollectionId,
        [Query.orderAsc('label')]
      );
      const list: Row[] = response.documents.map((doc: any) => ({
        id: doc.$id,
        label: doc.label,
        url: doc.url,
        active: doc.active,
        $updatedAt: doc.$updatedAt,
        $createdAt: doc.$createdAt,
      }));
      setRows(list);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    fetchLocations();
    // Realtime subscription
    const unsubscribe = client.subscribe(
      `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.locationsCollectionId}.documents`,
      (response: RealtimeResponseEvent<Row>) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create') ||
          response.events.includes('databases.*.collections.*.documents.*.update') ||
          response.events.includes('databases.*.collections.*.documents.*.delete')) {
          fetchLocations();
        }
      }
    );
    return () => {
      unsubscribe();
    }
  }, []);

  const resetForm = () => {
    setLabel('');
    setUrl('');
    setActive(true);
    setFile(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const uploadPdfIfAny = async (): Promise<string> => {
    if (file) {
      const isPdfByType = (file.type || '').toLowerCase().includes('pdf');
      const isPdfByName = /\.pdf$/i.test(file.name);
      if (!isPdfByType && !isPdfByName) throw new Error('Please upload a PDF file (.pdf).');
      if (file.size > 20 * 1024 * 1024) throw new Error('PDF must be 20 MB or smaller.');

      const uploadedFile = await storage.createFile(
        appwriteConfig.bucketId,
        ID.unique(),
        file
      );

      const fileUrl = storage.getFileView(appwriteConfig.bucketId, uploadedFile.$id);
      return fileUrl.toString();
    }
    if (url) return url;
    throw new Error('A PDF file is required.');
  };

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error('Please enter location label.');
      return;
    }
    setBusy(true);
    try {
      const finalUrl = await uploadPdfIfAny();
      if (!finalUrl) {
        toast.error('An error occurred while getting the file URL.');
        return;
      }

      const data = {
        label: label.trim(),
        url: finalUrl,
        active,
      };

      if (editingId) {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.locationsCollectionId,
          editingId,
          data
        );
        toast.success("Location updated successfully");
      } else {
        await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.locationsCollectionId,
          ID.unique(),
          data
        );
        toast.success("Location created successfully");
      }
      await fetchLocations();
      resetForm();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to save');
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
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleDeleteClick = (row: Row) => {
    setDeleteDialog({ isOpen: true, row });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.row) return;

    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.locationsCollectionId,
        deleteDialog.row.id
      );
      toast.success(`Deleted "${deleteDialog.row.label}"`);
      await fetchLocations();
      if (editingId === deleteDialog.row.id) resetForm();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleteDialog({ isOpen: false, row: null });
    }
  };

  const canSave = useMemo(() => !!label.trim() && (!!url || !!file), [label, url, file]);

  return (
    <section className="bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <div className="mx-auto max-w-full pb-12 pt-6">

        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">My Catalogue</h1>
            <p className="text-muted-foreground">Manage your catalogue locations and files</p>
          </div>
        </div>

        {/* Editor Card */}
        <div ref={formRef} className="rounded-3xl border border-border bg-card text-card-foreground p-8 shadow-sm backdrop-blur-sm relative overflow-hidden z-10">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                {editingId ? <Edit2 className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
              </div>
              <h2 className="text-xl font-semibold text-foreground/90">
                {editingId ? 'Edit Location' : 'Add New Location'}
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Label Name</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Awfis – Ambience Mall"
                  className="bg-muted/50 border-input text-foreground placeholder:text-muted-foreground h-12 focus-visible:ring-primary/50 focus-visible:border-primary/50"
                />
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="active-status"
                    checked={active}
                    onCheckedChange={(checked) => setActive(checked === true)}
                    className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="active-status" className="cursor-pointer text-foreground/80 font-medium hover:text-foreground transition-colors">
                    Active Status
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Catalogue PDF {editingId && '(Upload to replace)'}
                </label>
                <div className={`relative group border-2 border-dashed rounded-xl transition-all ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-border/80 bg-muted/20'}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    {file ? (
                      <>
                        <FileUp className="w-8 h-8 text-primary mb-3" />
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors mb-3" />
                        <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          Click or drag PDF here
                        </p>
                        {url && editingId && (
                          <p className="text-xs text-primary mt-2 font-medium">
                            Current: {url.split('/').pop()?.substring(0, 20)}...
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border flex gap-4">
            <Button
              disabled={!canSave || busy}
              onClick={handleSave}
              className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                editingId ? 'Update Location' : 'Add Location'
              )}
            </Button>

            {editingId && (
              <Button
                variant="outline"
                onClick={resetForm}
                className="bg-muted hover:bg-muted/80 text-foreground border-transparent hover:text-foreground h-12 px-6 rounded-xl"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* List Section */}
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-semibold text-foreground/80 px-2">Active Locations ({rows.length})</h3>

          <div className="rounded-2xl border border-border bg-card overflow-x-auto">
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="px-6 py-4 font-medium">Label</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Last Updated</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rows.map((r) => (
                    <tr key={r.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {r.label}
                        </div>
                        <a
                          href={r.url}
                          target="_blank"
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate max-w-[200px] block mt-1"
                        >
                          View File
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {r.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {r.$updatedAt ? new Date(r.$updatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(r)}
                            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteClick(r)}
                            className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 rounded-full bg-muted">
                            <FileUp className="w-8 h-8 opacity-50" />
                          </div>
                          <p>No locations found. Add your first one above.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border">
              {rows.map((r) => (
                <div key={r.id} className="p-4 space-y-3 bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">{r.label}</h4>
                      <a
                        href={r.url}
                        target="_blank"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <FileUp className="w-3 h-3" /> View File
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(r)}
                        className="p-2 rounded-lg bg-muted text-foreground/70 hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(r)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      {r.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {r.$updatedAt ? new Date(r.$updatedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              ))}

              {rows.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <FileUp className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No locations found.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent className="bg-card border-border text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the location
              <span className="font-semibold text-foreground"> "{deleteDialog.row?.label}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border hover:bg-muted/80 hover:text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
