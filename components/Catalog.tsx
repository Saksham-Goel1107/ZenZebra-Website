'use client';

import { appwriteConfig, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ExternalLink, FileText, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

type LocationItem = {
  id: string;
  label: string;
  file: string;
};

export default function CataloguePage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.locationsCollectionId,
          [Query.equal('active', true), Query.orderAsc('label')],
        );
        const mapped: LocationItem[] = response.documents.map((doc: any) => ({
          id: doc.$id,
          label: doc.label,
          file: doc.url,
        }));
        setLocations(mapped);
        if (mapped.length > 0) {
          setSelected(mapped[0].file);
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const currentLabel = locations.find((l) => l.file === selected)?.label || 'Select Location';

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center px-6 py-24 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#CC2224] opacity-[0.15] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-500 opacity-[0.05] blur-[100px] pointer-events-none" />

      <div className="w-full max-w-7xl z-10 flex flex-col gap-8 md:gap-12">
        {/* Header Content */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h2 className="text-[#CC2224] font-semibold tracking-wider text-sm uppercase">
              Curated Collections
            </h2>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Explore Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Catalogue
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg md:text-xl leading-relaxed"
          >
            Discover handpicked products and experiences tailored for your specific workspace.
          </motion.p>
        </div>

        {/* Controls Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 md:p-3 flex flex-col md:flex-row items-center gap-3 z-30 max-w-4xl mx-auto"
        >
          {/* Custom Styling for Dropdown */}
          <div className="relative w-full md:flex-1">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl transition-all border border-transparent hover:border-white/10 outline-none group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-[#CC2224]/10 rounded-lg text-[#CC2224]">
                  <MapPin className="w-5 h-5" />
                </div>
                <span
                  className={`block truncate text-base font-medium ${!selected ? 'text-white/50' : 'text-white'}`}
                >
                  {currentLabel}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/40 transition-transform duration-300 group-hover:text-white/70 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 p-1.5"
                  >
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelected(loc.file);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-all group ${
                          selected === loc.file
                            ? 'bg-white/10 text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="font-medium">{loc.label}</span>
                        {selected === loc.file && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#CC2224]" />
                        )}
                      </button>
                    ))}
                    {locations.length === 0 && (
                      <div className="px-4 py-3 text-sm text-white/40 text-center">
                        No locations found
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Vertical Divider (Desktop) */}
          <div className="hidden md:block w-px h-10 bg-white/10" />

          {/* Action Button */}
          <button
            onClick={() => selected && window.open(selected, '_blank')}
            disabled={!selected}
            className="w-full md:w-auto min-w-[200px] flex items-center justify-center gap-2.5 px-6 py-4 bg-[#CC2224] text-white font-medium rounded-xl hover:bg-[#b01c1e] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_8px_20px_rgba(204,34,36,0.25)] hover:shadow-[0_12px_30px_rgba(204,34,36,0.4)]"
          >
            <span>Open in Fullscreen</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Document Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full h-[70vh] md:h-[80vh] bg-[#111] rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl group flex flex-col"
        >
          {/* Window Controls Decoration */}
          <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
              <div className="w-3 h-3 rounded-full bg-green-500/20" />
            </div>
          </div>

          {selected ? (
            <iframe
              key={selected}
              src={`${selected}#view=FitH`}
              className="w-full flex-1 bg-[#1a1a1a]"
              title="Catalogue Preview"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
                <div className="relative p-8 rounded-full bg-[#222] border border-white/10">
                  <FileText className="w-16 h-16 text-white/40" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-medium text-white/80">No Catalogue Selected</h3>
                <p className="mt-2 text-white/40">Please choose a location to view its catalogue</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
