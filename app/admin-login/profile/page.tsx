'use client';

import { AdminProfile } from '@/components/AdminProfile';
import { account } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const router = useRouter();

    const logout = async () => {
        try {
            await account.deleteSession('current');
            router.replace('/admin-login');
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const u = await account.get();
                setUser(u);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                router.replace('/admin-login');
            }
        };
        fetchUser();
    }, [router]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-[#CC2224] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-8">
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
                <AdminProfile user={user} setUser={setUser} onLogout={logout} />
            </div>
        </div>
    );
}
