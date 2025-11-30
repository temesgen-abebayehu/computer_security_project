"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    verifyOtp: (userId: string, otp: string) => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkAuth = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success) {
            if (res.data.mfaRequired) {
                return res.data;
            }
            await checkAuth();
            router.push('/dashboard');
        }
        return res.data;
    };

    const register = async (data: any) => {
        await api.post('/auth/register', data);
        // router.push('/login?registered=true'); // Removed redirect to allow success message on register page
    };

    const verifyOtp = async (userId: string, otp: string) => {
        await api.post('/auth/verify-otp', { userId, otp });
        await checkAuth();
        router.push('/dashboard');
    };

    const logout = async () => {
        try {
            await api.get('/auth/logout');
        } catch (e) {
            console.error(e);
        }
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, verifyOtp, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
