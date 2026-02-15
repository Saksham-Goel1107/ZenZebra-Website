'use client';

import { account, isOwner } from '@/lib/appwrite';
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  MessageSquare,
  Save,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SettingsData {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  adminLocked: boolean;
  supportEmail: string;
  supportPhone: string;
  googleAnalyticsId: string;
  socialInstagram: string;
  socialLinkedIn: string;
  logoUrl: string;
  ogImageUrl: string;
  emailNotificationsEnabled: boolean;
  inquiryConfirmationSubject: string;
  inquiryConfirmationTemplate: string;
  inquiryStatusUpdateSubject: string;
  inquiryStatusUpdateTemplate: string;
  analyticsChatbotEnabled: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  siteName: '',
  siteDescription: '',
  maintenanceMode: false,
  maintenanceMessage:
    "We're currently upgrading our systems to provide a better experience. Please check back soon.",
  adminLocked: false,
  supportEmail: '',
  supportPhone: '',
  googleAnalyticsId: '',
  socialInstagram: '',
  socialLinkedIn: '',
  logoUrl: '',
  ogImageUrl: '',
  emailNotificationsEnabled: true,
  inquiryConfirmationSubject: '',
  inquiryConfirmationTemplate: '',
  inquiryStatusUpdateSubject: '',
  inquiryStatusUpdateTemplate: '',
  analyticsChatbotEnabled: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const router = useRouter();

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const user = await account.get();
        const owner = await isOwner(user.$id);
        if (!owner) {
          toast.error('Unauthorized Access', {
            description: 'You do not have permission to modify global system settings.',
          });
          router.push('/admin-login/catalogue-dashboard');
          return;
        }
        fetchSettings();
      } catch (error) {
        router.push('/admin-login');
      }
    };
    checkPermission();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const { jwt } = await account.createJWT();
      const res = await fetch('/api/settings', {
        headers: {
          'X-Appwrite-JWT': jwt,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      } else {
        toast.error('Failed to load settings');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { jwt } = await account.createJWT();
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-JWT': jwt,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('Global settings updated. Changes may take up to 30s to propagate.');
        if (settings.adminLocked) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#CC2224]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto py-6 pb-20">
      {/* Header - Theme Aware */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-border">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2 uppercase italic">
            System <span className="text-[#CC2224]">Settings</span>
          </h1>
          <p className="text-muted-foreground font-medium text-sm">
            Configure global application behavior and security.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#CC2224] hover:bg-[#b01c1e] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-[#CC2224]/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
        {/* Navigation Sidebar */}
        <div className="space-y-2 lg:sticky lg:top-32 h-fit">
          <SettingsTab
            active={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
            icon={<Globe className="w-5 h-5" />}
            label="General & SEO"
          />
          <SettingsTab
            active={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
            icon={<Shield className="w-5 h-5" />}
            label="Security & Access"
          />
          <SettingsTab
            active={activeTab === 'social'}
            onClick={() => setActiveTab('social')}
            icon={<Bell className="w-5 h-5" />}
            label="Contact & Social"
          />
          <SettingsTab
            active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
            icon={<Zap className="w-5 h-5" />}
            label="Performance"
          />
          <SettingsTab
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            icon={<Bell className="w-5 h-5" />}
            label="Notifications"
          />
          <div className="h-px bg-border my-4" />
          <Link href="/admin-login/inquiries" className="block">
            <SettingsTab
              active={false}
              icon={<MessageSquare className="w-5 h-5" />}
              label="User Inquiries"
              isLink
            />
          </Link>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'general' && (
            <Section
              title="General Configuration"
              description="Manage your site's public identity and metadata."
            >
              <div className="space-y-6">
                <InputGroup
                  label="Website Title"
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  placeholder="ZenZebra - Curated Lifestyle"
                />
                <InputGroup
                  label="Meta Description"
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                  placeholder="World's first lifestyle-integrated brand..."
                  area
                />
                <div className="h-px bg-border w-full my-2" />
                <InputGroup
                  label="Site Logo URL"
                  value={settings.logoUrl}
                  onChange={(e) => updateSetting('logoUrl', e.target.value)}
                  placeholder="https://..."
                />
                <InputGroup
                  label="Social Share Image (OG) URL"
                  value={settings.ogImageUrl}
                  onChange={(e) => updateSetting('ogImageUrl', e.target.value)}
                  placeholder="https://..."
                />
                <div className="h-px bg-border w-full my-2" />
                <div className="flex items-center justify-between p-4 rounded-3xl bg-muted/30 border border-border group hover:border-[#CC2224]/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold text-sm flex items-center gap-2 uppercase tracking-tighter">
                      Maintenance Mode
                      {settings.maintenanceMode && (
                        <span className="px-2 py-0.5 rounded-md bg-[#CC2224] text-[8px] text-white uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium mt-1 leading-tight">
                      Disable public access while performing updates.
                    </span>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                </div>
                {settings.maintenanceMode && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <InputGroup
                      label="Maintenance Message"
                      value={settings.maintenanceMessage}
                      onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                      placeholder="Message shown to visitors..."
                      area
                    />
                  </div>
                )}
              </div>
            </Section>
          )}

          {activeTab === 'security' && (
            <Section
              title="Security Enforcement"
              description="Configure sensitive access controls."
            >
              <div className="space-y-6">
                <div
                  className={`p-6 rounded-[2rem] border transition-all duration-300 ${settings.adminLocked ? 'bg-destructive/10 border-destructive shadow-[0_0_30px_-5px_oklch(var(--destructive)/0.2)]' : 'bg-muted/30 border-border hover:border-[#CC2224]/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`font-black text-sm uppercase tracking-tighter flex items-center gap-2 ${settings.adminLocked ? 'text-destructive' : 'text-foreground'}`}
                      >
                        {settings.adminLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                        Admin Emergency Kill Switch
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium max-w-[280px] leading-tight">
                        {settings.adminLocked
                          ? 'SYSTEM LOCKDOWN IMMINENT. Saving will disable all admin access immediately.'
                          : 'Immediately disable the entire admin dashboard. Use only in case of a security breach.'}
                      </span>
                    </div>
                    <Switch
                      checked={settings.adminLocked}
                      onChange={(checked) => updateSetting('adminLocked', checked)}
                    />
                  </div>
                  {settings.adminLocked && (
                    <div className="mt-4 p-4 bg-destructive/10 rounded-2xl border border-destructive/20 text-[11px] text-destructive flex gap-3 items-start font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>CRITICAL WARNING:</strong> This will lock YOU out. You will need
                        direct database access to Appwrite to revert this setting (`adminLocked:
                        false`).
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-muted/20 rounded-[1.5rem] border border-border flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-bold leading-relaxed italic">
                    Note: Advanced authentication policies (2FA, Password Complexity) are managed
                    directly within your Appwrite Cloud Console Auth Security.
                  </p>
                </div>
              </div>
            </Section>
          )}

          {activeTab === 'social' && (
            <Section
              title="Contact & Social"
              description="Manage public contact information and social media links."
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup
                    label="Support Email"
                    value={settings.supportEmail}
                    onChange={(e) => updateSetting('supportEmail', e.target.value)}
                    placeholder="support@zenzebra.in"
                  />
                  <InputGroup
                    label="Support Phone"
                    value={settings.supportPhone}
                    onChange={(e) => updateSetting('supportPhone', e.target.value)}
                    placeholder="+91-..."
                  />
                </div>
                <div className="h-px bg-border w-full my-4" />
                <div className="space-y-4">
                  <InputGroup
                    label="Instagram URL"
                    value={settings.socialInstagram}
                    onChange={(e) => updateSetting('socialInstagram', e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                  <InputGroup
                    label="LinkedIn URL"
                    value={settings.socialLinkedIn}
                    onChange={(e) => updateSetting('socialLinkedIn', e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            </Section>
          )}

          {activeTab === 'performance' && (
            <Section
              title="Analytics & Integration"
              description="Third-party tracking and performance monitoring."
            >
              <div className="space-y-6">
                <InputGroup
                  label="Google Analytics ID"
                  value={settings.googleAnalyticsId}
                  onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-bold">
                    More performance settings (caching, CDN, Image Optimization) are managed via
                    your Vercel/Next.js hosting dashboard.
                  </p>
                </div>

                <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/30 border border-border group hover:border-[#CC2224]/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold text-sm flex items-center gap-2 uppercase tracking-tighter">
                      Analytics AI Assistant
                      {settings.analyticsChatbotEnabled ? (
                        <span className="px-2 py-0.5 rounded-md bg-green-500 text-[8px] text-white uppercase tracking-wider">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-500 text-[8px] text-white uppercase tracking-wider">
                          Disabled
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium mt-1 leading-tight">
                      Allow owners to query business data using the AI Chatbot.
                    </span>
                  </div>
                  <Switch
                    checked={settings.analyticsChatbotEnabled}
                    onChange={(checked) => updateSetting('analyticsChatbotEnabled', checked)}
                  />
                </div>
              </div>
            </Section>
          )}

          {activeTab === 'notifications' && (
            <Section
              title="Email Notifications"
              description="Configure automated emails sent to users for inquiries and updates."
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/30 border border-border group hover:border-[#CC2224]/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold text-sm flex items-center gap-2 uppercase tracking-tighter">
                      Enable Email Notifications
                      {settings.emailNotificationsEnabled && (
                        <span className="px-2 py-0.5 rounded-md bg-green-500 text-[8px] text-white uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium mt-1 leading-tight">
                      Globally enable or disable automated email responses.
                    </span>
                  </div>
                  <Switch
                    checked={settings.emailNotificationsEnabled}
                    onChange={(checked) => updateSetting('emailNotificationsEnabled', checked)}
                  />
                </div>

                {settings.emailNotificationsEnabled && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
                          Inquiry Confirmation
                        </h4>
                      </div>
                      <InputGroup
                        label="Subject Line"
                        value={settings.inquiryConfirmationSubject}
                        onChange={(e) =>
                          updateSetting('inquiryConfirmationSubject', e.target.value)
                        }
                        placeholder="ZenZebra - Inquiry Received: {name}"
                      />
                      <InputGroup
                        label="Template Body"
                        value={settings.inquiryConfirmationTemplate}
                        onChange={(e) =>
                          updateSetting('inquiryConfirmationTemplate', e.target.value)
                        }
                        placeholder="Hello {name}..."
                        area
                      />
                      <p className="text-[10px] text-muted-foreground font-bold italic ml-2">
                        Available variables:{' '}
                        <span className="text-primary">{`{name}, {query}`}</span>
                      </p>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
                          Status Update Alert
                        </h4>
                      </div>
                      <InputGroup
                        label="Subject Line"
                        value={settings.inquiryStatusUpdateSubject}
                        onChange={(e) =>
                          updateSetting('inquiryStatusUpdateSubject', e.target.value)
                        }
                        placeholder="ZenZebra - Inquiry Update: {status}"
                      />
                      <InputGroup
                        label="Template Body"
                        value={settings.inquiryStatusUpdateTemplate}
                        onChange={(e) =>
                          updateSetting('inquiryStatusUpdateTemplate', e.target.value)
                        }
                        placeholder="Hello {name}..."
                        area
                      />
                      <p className="text-[10px] text-muted-foreground font-bold italic ml-2">
                        Available variables:{' '}
                        <span className="text-primary">{`{name}, {status}`}</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-start gap-3">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                        <strong>SAFEGUARD:</strong> The system automatically fallbacks to standard
                        formatting if variables are missing. Line breaks in the template are
                        automatically converted to HTML tags.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2.5rem] border border-border bg-card p-8 sm:p-10 shadow-2xl shadow-black/5 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
      {/* Subtle gloss effect */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/[0.03] blur-[100px] pointer-events-none group-hover:bg-primary/[0.07] transition-all duration-1000" />

      <div className="relative z-10">
        <h3 className="text-2xl font-black tracking-tighter uppercase italic text-foreground mb-1">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-10 max-w-sm font-medium">{description}</p>
        {children}
      </div>
    </div>
  );
}

function SettingsTab({
  label,
  icon,
  active = false,
  onClick,
  isLink = false,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  isLink?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
        active
          ? 'bg-[#CC2224] text-white shadow-xl shadow-[#CC2224]/30 scale-[1.02]'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
      }`}
    >
      <span
        className={`p-2 rounded-xl transition-colors flex items-center justify-center ${active ? 'bg-white/20' : 'bg-muted group-hover:bg-muted-foreground/10'}`}
      >
        {icon}
      </span>
      <span className="font-black text-xs uppercase tracking-tighter text-left flex-1">
        {label}
      </span>
      {isLink && (
        <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

function InputGroup({
  label,
  placeholder,
  area = false,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  area?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black italic text-muted-foreground uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#CC2224] transition-colors">
        {label}
      </label>
      {area ? (
        <textarea
          className="w-full bg-background border border-border rounded-2xl p-4 text-foreground text-sm placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-[#CC2224]/30 focus:border-[#CC2224] transition-all min-h-[120px] outline-none resize-none font-medium"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      ) : (
        <input
          type="text"
          className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-foreground text-sm placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-[#CC2224]/30 focus:border-[#CC2224] transition-all outline-none font-medium"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function Switch({
  checked = false,
  onChange,
}: {
  checked?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-14 h-8 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-muted-foreground after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#CC2224] peer-checked:after:bg-white peer-checked:after:shadow-lg group-hover:bg-muted transition-colors"></div>
    </label>
  );
}
