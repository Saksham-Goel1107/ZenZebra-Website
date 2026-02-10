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
import { account, appwriteConfig, default as client, databases, storage } from '@/lib/appwrite';
import { ID, Models, Query, RealtimeResponseEvent } from 'appwrite';
import { CheckCircle2, Edit2, FileUp, Loader2, Trash2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from "sonner";
import { AdminProfile } from './AdminProfile';

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
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [label, setLabel] = useState('');
  // URL is now purely derived from upload, or existing if editing
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
    const fetchUser = async () => {
      try {
        const u = await account.get();
        setUser(u);
        setUser(u);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
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
    // Scroll to top of form gently
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const uploadPdfIfAny = async (): Promise<string> => {
    // If we have a new file, upload it
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

      // Get the view URL
      const fileUrl = storage.getFileView(appwriteConfig.bucketId, uploadedFile.$id);
      return fileUrl.toString();
    }

    // If no new file, but we have an existing URL (editing mode), return that
    if (url) return url;

    // Otherwise error
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

      // Removed 'updatedAt' from payload to fix 400 error
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

    // Scroll to form so user sees they are editing
    if (formRef.current) {
      // Add a small delay to ensure UI renders
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
      if (editingId === deleteDialog.row.id) resetForm();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleteDialog({ isOpen: false, row: null });
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      router.replace('/admin-login');
    } catch (e) {
      console.error(e);
    }
  };

  // Enable save if label exists AND (url exists from editOR file selected)
  const canSave = useMemo(() => !!label.trim() && (!!url || !!file), [label, url, file]);

  return (
    <section className="bg-[#050505] text-white font-sans selection:bg-[#CC2224] selection:text-white">
      <div className="mx-auto max-w-full px-6 pb-12 pt-6">

        {/* User Profile Section */}
        {user && (
          <AdminProfile user={user} setUser={setUser} onLogout={logout} />
        )}

        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Catalogue</h1>
            <p className="text-white/40">Manage your catalogue locations and files</p>
          </div>
        </div>

        {/* Editor Card */}
        <div ref={formRef} className="rounded-3xl border border-white/10 bg-[#111] p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden z-10">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#CC2224]/5 blur-[100px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#CC2224]/10 rounded-xl text-[#CC2224]">
                {editingId ? <Edit2 className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
              </div>
              <h2 className="text-xl font-semibold text-white/90">
                {editingId ? 'Edit Location' : 'Add New Location'}
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white/60">Label Name</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Awfis – Ambience Mall"
                  className="bg-black/40 border-white/10 text-white placeholder:text-white/20 h-12 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50"
                />
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="active-status"
                    checked={active}
                    onCheckedChange={(checked) => setActive(checked === true)}
                    className="border-white/20 data-[state=checked]:bg-[#CC2224] data-[state=checked]:border-[#CC2224]"
                  />
                  <Label htmlFor="active-status" className="cursor-pointer text-white/80 font-medium hover:text-white transition-colors">
                    Active Status
                  </Label>
                </div>
              </div>
            </div>

            {/* Right Column (File Upload) */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Catalogue PDF {editingId && '(Upload to replace)'}
                </label>
                <div className={`relative group border-2 border-dashed rounded-xl transition-all ${file ? 'border-[#CC2224]/50 bg-[#CC2224]/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}>
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
                        <FileUp className="w-8 h-8 text-[#CC2224] mb-3" />
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors mb-3" />
                        <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                          Click or drag PDF here
                        </p>
                        {url && editingId && (
                          <p className="text-xs text-[#CC2224] mt-2 font-medium">
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

          {/* Action Footer */}
          <div className="mt-10 pt-6 border-t border-white/5 flex gap-4">
            <Button
              disabled={!canSave || busy}
              onClick={handleSave}
              className="flex-1 md:flex-none bg-[#CC2224] hover:bg-[#b01c1e] text-white font-medium h-12 px-8 rounded-xl shadow-lg shadow-[#CC2224]/20"
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
                className="bg-white/5 hover:bg-white/10 text-white/80 border-transparent hover:text-white h-12 px-6 rounded-xl"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* List Section */}
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-semibold text-white/80 px-2">Active Locations ({rows.length})</h3>

          <div className="rounded-2xl border border-white/10 bg-[#111] overflow-x-auto">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40 bg-white/[0.02]">
                    <th className="px-6 py-4 font-medium">Label</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Last Updated</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r) => (
                    <tr key={r.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white/90 group-hover:text-[#CC2224] transition-colors">
                          {r.label}
                        </div>
                        <a
                          href={r.url}
                          target="_blank"
                          className="text-xs text-white/30 hover:text-white/60 hover:underline truncate max-w-[200px] block mt-1"
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-white/40 text-xs font-medium border border-white/10">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/40">
                        {r.$updatedAt ? new Date(r.$updatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(r)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
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
                      <td colSpan={4} className="px-6 py-12 text-center text-white/30">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 rounded-full bg-white/5">
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {rows.map((r) => (
                <div key={r.id} className="p-4 space-y-3 bg-[#111]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white/90 text-sm mb-1">{r.label}</h4>
                      <a
                        href={r.url}
                        target="_blank"
                        className="text-xs text-white/40 hover:text-[#CC2224] flex items-center gap-1 transition-colors"
                      >
                        <FileUp className="w-3 h-3" /> View File
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(r)}
                        className="p-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
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

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {r.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    <span className="text-white/30">
                      {r.$updatedAt ? new Date(r.$updatedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              ))}

              {rows.length === 0 && (
                <div className="p-8 text-center text-white/30">
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
        <AlertDialogContent className="bg-[#111] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action cannot be undone. This will permanently delete the location
              <span className="font-semibold text-white"> "{deleteDialog.row?.label}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
