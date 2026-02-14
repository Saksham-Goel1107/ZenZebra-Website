'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appwriteConfig, default as client, databases, storage } from '@/lib/appwrite';
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Edit2,
  ExternalLink,
  FileUp,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type Row = {
  id: string;
  label: string;
  url: string;
  active: boolean;
  $updatedAt?: string;
  $createdAt?: string;
};

export default function CatalogueDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; row: Row | null }>({
    isOpen: false,
    row: null,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const fetchLocations = async () => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.locationsCollectionId,
        [Query.orderDesc('$createdAt')],
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const unsubscribe = client.subscribe(
      `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.locationsCollectionId}.documents`,
      (response: RealtimeResponseEvent<Row>) => {
        if (
          response.events.some(
            (e) => e.includes('.create') || e.includes('.update') || e.includes('.delete'),
          )
        ) {
          fetchLocations();
        }
      },
    );
    return () => unsubscribe();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => r.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [rows, searchQuery]);

  const resetForm = () => {
    setLabel('');
    setUrl('');
    setActive(true);
    setFile(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadPdfIfAny = async (): Promise<string> => {
    if (file) {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) throw new Error('System only accepts valid PDF documents.');
      if (file.size > 25 * 1024 * 1024) throw new Error('Maximum payload size (25MB) exceeded.');

      const uploadedFile = await storage.createFile(appwriteConfig.bucketId, ID.unique(), file);

      const fileUrl = storage.getFileView(appwriteConfig.bucketId, uploadedFile.$id);
      return fileUrl.toString();
    }
    if (url) return url;
    throw new Error('Intelligence package (PDF) required.');
  };

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error('Location identity required.');
      return;
    }
    setBusy(true);
    try {
      const finalUrl = await uploadPdfIfAny();
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
          data,
        );
        toast.success('Location identity updated');
      } else {
        await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.locationsCollectionId,
          ID.unique(),
          data,
        );
        toast.success('New location deployed');
      }
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || 'Deployment failed');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.row) return;
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.locationsCollectionId,
        deleteDialog.row.id,
      );
      toast.success(`Removed "${deleteDialog.row.label}"`);
      if (editingId === deleteDialog.row.id) resetForm();
    } catch (e: any) {
      toast.error('Removal failed');
    } finally {
      setDeleteDialog({ isOpen: false, row: null });
    }
  };

  const canSave = useMemo(() => !!label.trim() && (!!url || !!file), [label, url, file]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[#CC2224]">
            <div className="p-2 rounded-xl bg-[#CC2224]/10 border border-[#CC2224]/20">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Asset Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground italic">
            CATALOGUE <span className="text-[#CC2224]">STATIONS</span>
          </h1>
          <p className="text-muted-foreground max-w-md">
            Manage your physical locations and their associated digital catalogues.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Editor (Left/Top) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#CC2224]/5 blur-3xl pointer-events-none group-hover:bg-[#CC2224]/10 transition-colors" />

            <h2 className="text-2xl font-bold text-foreground italic uppercase tracking-tighter mb-8 flex items-center gap-3">
              {editingId ? (
                <Edit2 className="w-5 h-5 text-[#CC2224]" />
              ) : (
                <Plus className="w-5 h-5 text-[#CC2224]" />
              )}
              {editingId ? 'Modify Station' : 'Deploy Station'}
            </h2>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#CC2224] ml-1">
                  Location Identity
                </label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Zen HQ - Bangalore"
                  className="bg-background border-input h-12 focus-visible:ring-[#CC2224]/50 focus-visible:border-[#CC2224]/50 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#CC2224] ml-1">
                  Catalogue Package (PDF)
                </label>
                <div
                  className={`
                    relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
                    ${file ? 'border-[#CC2224]/50 bg-[#CC2224]/5' : 'border-border hover:border-foreground/20 bg-muted/20'}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    {file ? (
                      <>
                        <FileUp className="w-8 h-8 text-[#CC2224] mb-3" />
                        <p className="text-xs font-bold text-foreground truncate max-w-full italic">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
                          {(file.size / 1024 / 1024).toFixed(2)} MB Payload
                        </p>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-8 h-8 text-muted-foreground/50 group-hover:text-[#CC2224] transition-colors mb-3" />
                        <p className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors italic">
                          Click or drop intelligence PDF
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-border">
                <Checkbox
                  id="active-mode"
                  checked={active}
                  onCheckedChange={(c) => setActive(c === true)}
                  className="border-input data-[state=checked]:bg-[#CC2224] data-[state=checked]:border-[#CC2224]"
                />
                <Label
                  htmlFor="active-mode"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer"
                >
                  Online Broadcast Mode
                </Label>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  disabled={!canSave || busy}
                  onClick={handleSave}
                  className="w-full h-14 bg-[#CC2224] hover:bg-[#b01c1e] text-white font-bold uppercase tracking-widest italic shadow-[0_0_20px_rgba(204,34,36,0.3)] transition-all active:scale-95"
                >
                  {busy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingId ? (
                    'Push Update'
                  ) : (
                    'Initialize Station'
                  )}
                </Button>
                {editingId && (
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    Abort Configuration
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Directory (Right/Bottom) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-[2rem] border border-border">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#CC2224] transition-colors" />
              <Input
                placeholder="Search station network..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background border-input pl-11 h-12 focus-visible:ring-[#CC2224]/20 text-foreground"
              />
            </div>
            <div className="px-4 py-2 bg-background border border-border rounded-xl text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {filteredRows.length} Stations Active
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={`sk-${i}`}
                    className="h-48 rounded-[2rem] bg-white/[0.03] border border-white/5 animate-pulse"
                  />
                ))
              ) : filteredRows.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center bg-muted/10 border border-dashed border-border rounded-[2.5rem]"
                >
                  <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.2em] italic">
                    No stations detected in search
                  </p>
                </motion.div>
              ) : (
                filteredRows.map((row) => (
                  <motion.div
                    layout
                    key={row.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group bg-card border border-border rounded-[2rem] p-6 transition-all hover:bg-card/90 hover:border-[#CC2224]/30 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted/10 border border-border flex items-center justify-center text-[#CC2224] font-black group-hover:scale-110 transition-transform">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-md font-extrabold text-foreground truncate max-w-[150px] italic">
                            {row.label}
                          </h3>
                          <div
                            className={`mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border w-fit ${row.active ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-muted border-border text-muted-foreground'}`}
                          >
                            {row.active ? 'Broadcasting' : 'Offline'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(row)}
                          className="h-8 w-8 text-foreground hover:bg-accent rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ isOpen: true, row })}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                      <a
                        href={row.url}
                        target="_blank"
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border group/link hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground group-hover/link:text-[#CC2224]" />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover/link:text-foreground uppercase tracking-wider">
                            Catalogue Intelligence
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover/link:text-foreground/70" />
                      </a>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Updated{' '}
                        {row.$updatedAt ? new Date(row.$updatedAt).toLocaleDateString() : 'Initial'}
                      </div>
                      <span className="font-mono">ID: {row.id.slice(-6)}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(o) => setDeleteDialog((prev) => ({ ...prev, isOpen: o }))}
      >
        <AlertDialogContent className="bg-card border-border text-foreground max-w-sm rounded-[2rem]">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold italic uppercase text-center">
              Terminate Station?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center pt-2">
              This will permanently revoke all broadcasting from{' '}
              <span className="text-foreground font-bold">"{deleteDialog.row?.label}"</span>. This
              action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-2">
            <AlertDialogCancel className="bg-transparent border-border hover:bg-accent rounded-xl uppercase font-bold text-[10px] tracking-widest flex-1">
              Abort
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl uppercase font-bold text-[10px] tracking-widest flex-1"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
