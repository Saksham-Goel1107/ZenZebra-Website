import { getSystemSettings } from '@/lib/admin-settings';
import { AlertTriangle, Lock } from 'lucide-react';

export default async function AdminDisabled() {
  const settings = await getSystemSettings();
  const siteName = settings.siteName || 'ZenZebra';

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 max-w-lg animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-24 h-24 bg-red-950/30 rounded-full flex items-center justify-center border border-red-500/20 shadow-2xl shadow-red-500/10 backdrop-blur-sm">
          <Lock className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
            Portal <span className="text-red-500">Locked</span>
          </h1>
          <p className="text-white/40 text-lg font-medium leading-relaxed">
            Administrative access has been temporarily disabled for security reasons.
          </p>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-left">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200/80">
            If you believe this is an error, please contact the lead developer or system
            administrator directly to restore access via the backend console.
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 text-center w-full">
        <p className="text-white/20 text-xs uppercase tracking-[0.3em]">
          {siteName} Systems &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
