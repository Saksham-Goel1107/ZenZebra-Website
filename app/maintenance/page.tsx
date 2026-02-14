import { getSystemSettings } from '@/lib/admin-settings';
import { Construction } from 'lucide-react';

export default async function MaintenancePage() {
  // Fetch settings dynamically
  const settings = await getSystemSettings();
  const siteName = settings.siteName || 'ZenZebra';
  const message =
    settings.maintenanceMessage ||
    "We're currently upgrading our systems to provide a better experience. Please check back soon.";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#CC2224]/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />

      <div className="relative z-10 text-center space-y-6 max-w-lg">
        <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-2xl shadow-[#CC2224]/20 backdrop-blur-sm animate-bounce-slow">
          <Construction className="w-10 h-10 text-[#CC2224]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
            Under <span className="text-[#CC2224]">Maintenance</span>
          </h1>
          <p className="text-white/40 text-lg font-medium leading-relaxed">{message}</p>
        </div>

        <div className="pt-8 flex justify-center">
          <div className="h-1.5 w-48 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#CC2224] w-1/3 animate-loading-bar rounded-full" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-center w-full">
        <p className="text-white/20 text-xs uppercase tracking-[0.3em]">
          {siteName} &copy; {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
         @keyframes loading-bar {
           0% { transform: translateX(-100%); width: 20%; }
           50% { width: 50%; }
           100% { transform: translateX(400%); width: 20%; }
         }
         .animate-loading-bar {
           animation: loading-bar 1.5s ease-in-out infinite;
         }
         .animate-bounce-slow {
            animation: bounce 3s infinite;
         }
       `}</style>
    </div>
  );
}
