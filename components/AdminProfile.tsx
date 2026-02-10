'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { account, appwriteConfig, avatars, storage } from '@/lib/appwrite';
import { ID, Models } from 'appwrite';
import {
    Calendar,
    Camera,
    CheckCircle2,
    Edit2,
    Loader2,
    LogOut,
    Mail,
    Phone,
    QrCode,
    Save,
    ShieldCheck,
    Smartphone,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from "sonner";

interface AdminProfileProps {
    user: Models.User<Models.Preferences> | null;
    setUser: (user: Models.User<Models.Preferences> | null) => void;
    onLogout: () => void;
}

export function AdminProfile({ user, setUser, onLogout }: AdminProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [password, setPassword] = useState('');
    const [userAvatar, setUserAvatar] = useState('');
    const [busy, setBusy] = useState(false);

    // MFA State
    const [mfaSetup, setMfaSetup] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [challengeId, setChallengeId] = useState('');
    const [totpCode, setTotpCode] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                phone: user.phone || ''
            });

            let avatarUrl = avatars.getInitials(user.name).toString();
            if (user.prefs && (user.prefs as any).avatar) {
                avatarUrl = (user.prefs as any).avatar;
            }
            setUserAvatar(avatarUrl);
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        setBusy(true);
        try {
            if (formData.name !== user.name) {
                await account.updateName(formData.name);
            }
            if (formData.email !== user.email) {
                if (!password) throw new Error("Password required to update email");
                await account.updateEmail(formData.email, password);
            }
            if (formData.phone !== (user.phone || '')) {
                if (formData.phone) {
                    if (!password) throw new Error("Password required to update phone");
                    await account.updatePhone(formData.phone, password);
                }
            }

            const u = await account.get();
            setUser(u);
            toast.success('Profile updated successfully');
            setIsEditing(false);
            setPassword('');
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Failed to update profile');
        } finally {
            setBusy(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const toastId = toast.loading("Uploading avatar...");

        try {
            const uploaded = await storage.createFile(
                appwriteConfig.bucketId,
                ID.unique(),
                file
            );

            const fileUrl = storage.getFileView(appwriteConfig.bucketId, uploaded.$id).toString();

            await account.updatePrefs({ ...user.prefs, avatar: fileUrl });

            const u = await account.get();
            setUser(u);
            toast.success("Avatar updated!", { id: toastId });

        } catch (e: any) {
            toast.error('Failed to upload avatar: ' + e.message, { id: toastId });
        }
    };

    const initiateMfa = async () => {
        setChallengeId('');
        try {
            const challenge = await account.createMfaAuthenticator('totp' as any);
            console.log('MFA Challenge created (RAW):', JSON.stringify(challenge, null, 2));

            // Try different ID properties, fallback to 'totp' if missing
            const id = (challenge as any).$id || (challenge as any).id || 'totp';
            console.log('Extracted ID:', id);

            setChallengeId(id);

            const qr = avatars.getQR(challenge.uri).toString();
            setQrCode(qr);
            setMfaSetup(true);
        } catch (e: any) {
            console.error('Failed to init MFA:', e);
            toast.error('Failed to init MFA: ' + e.message);
        }
    };

    const confirmMfa = async () => {
        console.log('Confirming MFA with State Challenge ID (Secret):', challengeId);
        if (!challengeId) {
            toast.error('Error: Challenge info is missing.');
            return;
        }
        if (!totpCode || totpCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code.');
            return;
        }

        try {
            console.log('Verifying authenticator...', { challengeId, totpCode });
            // First verify the authenticator
            await account.updateMfaAuthenticator(challengeId as any, totpCode);
        } catch (e: any) {
            console.error('Authenticator verification failed:', e);
            toast.error('Verification failed: ' + e.message);
            return;
        }

        try {
            console.log('Enabling MFA status...');
            // In Appwrite SDK 22.0.0, the method is updateMFA (uppercase)
            // and it uses object parameter style: updateMFA({ mfa: boolean })
            await account.updateMFA({ mfa: true });

            setMfaSetup(false);
            const u = await account.get();
            setUser(u);
            toast.success("MFA Enabled Successfully!");
            setTotpCode('');
        } catch (e: any) {
            console.error('Enabling MFA failed:', e);
            toast.error('Failed to enable MFA status: ' + e.message);
        }
    };

    if (!user) return null;

    return (
        <Card className="bg-[#111] border-white/10 text-white overflow-hidden backdrop-blur-sm relative mb-12">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] pointer-events-none" />

            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">

                    {/* Main Profile Section */}
                    <div className="flex-1 p-6 md:p-8 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="relative group/avatar shrink-0">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg relative bg-neutral-900">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#CC2224] flex items-center justify-center text-2xl font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}

                                    {isEditing && (
                                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="w-6 h-6 text-white" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                        </label>
                                    )}
                                </div>

                                {!isEditing && user.emailVerification && (
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-black p-1 rounded-full border-2 border-[#111]" title="Email Verified">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 w-full">
                                {isEditing ? (
                                    <div className="space-y-4 w-full animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-2">
                                            <Label className="text-white/60 text-xs uppercase tracking-wider">Full Name</Label>
                                            <Input
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="bg-black/20 border-white/10 text-white focus-visible:ring-[#CC2224]/50"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
                                                <Input
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="bg-black/20 border-white/10 text-white focus-visible:ring-[#CC2224]/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white/60 text-xs uppercase tracking-wider">Phone</Label>
                                                <Input
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className="bg-black/20 border-white/10 text-white focus-visible:ring-[#CC2224]/50"
                                                    placeholder="+1234567890"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Label className="text-red-400 text-xs font-semibold uppercase tracking-wider">Current Password</Label>
                                            <p className="text-xs text-white/40 mb-1.5">Required for changing sensitive info (email/phone)</p>
                                            <Input
                                                type="password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="bg-red-500/5 border-red-500/20 text-white focus-visible:ring-red-500/50 placeholder:text-red-500/30"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-2 justify-center sm:justify-start">
                                            <Button onClick={handleUpdateProfile} disabled={busy} className="bg-[#CC2224] hover:bg-[#b01c1e] text-white">
                                                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                                Save Changes
                                            </Button>
                                            <Button variant="ghost" onClick={() => setIsEditing(false)} className="hover:bg-white/10 text-white/70 hover:text-white">
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative sm:pr-12 group flex flex-col items-center sm:block text-center sm:text-left">
                                        <h2 className="text-2xl sm:text-3xl font-bold title-font text-white mb-1">{user.name}</h2>
                                        <div className="flex items-center gap-2 text-white/60 mb-3 justify-center sm:justify-start">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="text-sm font-medium">{user.email}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.status ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {user.status ? 'Active Account' : 'Blocked'}
                                            </span>
                                            {user.labels?.map((label: string) => (
                                                <span key={label} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    {label}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex sm:absolute sm:top-0 sm:right-0 gap-2 mt-6 sm:mt-0">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setIsEditing(true)}
                                                className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl"
                                                title="Edit Profile"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={onLogout}
                                                className="h-9 w-9 bg-red-500/10 hover:bg-red-500/20 text-red-500/70 hover:text-red-500 rounded-xl"
                                                title="Sign Out"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details & MFA Section */}
                    <div className="w-full md:w-[400px] bg-white/[0.02] p-6 md:p-8 space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#CC2224]" />
                                Security & Details
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-start justify-between group">
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                        <User className="w-3.5 h-3.5" />
                                        <span>User ID</span>
                                    </div>
                                    <code className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-white/70 select-all hover:bg-white/10 transition-colors">
                                        {user.$id}
                                    </code>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>Phone</span>
                                    </div>
                                    <span className="text-sm text-white/80">
                                        {user.phone ? (
                                            <span className="flex items-center gap-1">
                                                {user.phone}
                                                {user.phoneVerification && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                            </span>
                                        ) : (
                                            <span className="text-white/30 italic">Not set</span>
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Registered</span>
                                    </div>
                                    <span className="text-sm text-white/80">
                                        {new Date(user.registration).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/10" />

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-[#CC2224]" />
                                    Two-Factor Auth
                                </h3>
                                <span className={user.mfa ? "text-xs text-green-400 font-medium px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20" : "text-xs text-white/40 font-medium px-2 py-0.5 bg-white/5 rounded-full"}>
                                    {user.mfa ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>

                            {mfaSetup ? (
                                <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-4 animate-in zoom-in-95 duration-200">
                                    <div className="text-center space-y-2">
                                        <p className="text-sm text-white/80 font-medium">Scan QR Code</p>
                                        <div className="bg-white p-2 rounded-lg inline-block">
                                            {qrCode && <img src={qrCode} alt="QR" className="w-32 h-32" />}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-white/50">Enter Authenticator Code</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={totpCode}
                                                onChange={e => setTotpCode(e.target.value)}
                                                className="bg-black border-white/20 text-center font-mono tracking-widest text-lg h-10"
                                                placeholder="000 000"
                                                maxLength={6}
                                            />
                                            <Button onClick={confirmMfa} size="icon" className="bg-[#CC2224] hover:bg-[#b01c1e] w-10 shrink-0">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setMfaSetup(false)} className="w-full text-xs text-white/40 h-8 hover:text-white">
                                            Cancel Setup
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                !user.mfa && (
                                    <Button
                                        variant="outline"
                                        onClick={initiateMfa}
                                        className="w-full border-dashed border-white/20 bg-transparent hover:bg-white/5 text-white/60 hover:text-white hover:border-white/40"
                                    >
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Setup Authenticator
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
