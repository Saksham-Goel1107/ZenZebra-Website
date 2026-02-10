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
            }
        };
        fetchUser();
    }, []);

    if (!user) return null;

    return (
        <div className="flex flex-1 flex-col gap-4 py-8">
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
                <AdminProfile user={user} setUser={setUser} onLogout={logout} />
            </div>
        </div>
    );
}
