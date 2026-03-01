'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getUserProfile, signIn, signOut } from '@/lib/supabase/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRecovery, setIsRecovery] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const savedUser = localStorage.getItem('hcf_user');
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);

                    const savedProfile = localStorage.getItem('hcf_profile');
                    if (savedProfile) {
                        const parsedProfile = JSON.parse(savedProfile);
                        setProfile(parsedProfile);
                        setRole(parsedProfile.role || 'editor');
                    } else {
                        // Re-fetch profile if missing
                        const freshProfile = await getUserProfile(parsedUser.id);
                        if (freshProfile) {
                            setProfile(freshProfile);
                            setRole(freshProfile.role || 'editor');
                            localStorage.setItem('hcf_profile', JSON.stringify(freshProfile));
                        }
                    }
                }
            } catch (error) {
                console.error("Auth initialization failed:", error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const signInWrapper = async (email, password) => {
        setLoading(true);
        try {
            const result = await signIn(email, password);
            if (result.user) {
                const userObj = { id: result.user.id, email: result.user.email };
                setUser(userObj);
                localStorage.setItem('hcf_user', JSON.stringify(userObj));

                // Profile is returned in login API in our custom setup
                if (result.user.profile) {
                    setProfile(result.user.profile);
                    setRole(result.user.profile.role || 'editor');
                    localStorage.setItem('hcf_profile', JSON.stringify(result.user.profile));
                }
            }
            setLoading(false);
            return result;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const signOutWrapper = async () => {
        setLoading(true);
        try {
            await signOut();
            setUser(null);
            setRole(null);
            setProfile(null);
            localStorage.removeItem('hcf_user');
            localStorage.removeItem('hcf_role');
            localStorage.removeItem('hcf_profile');
            setLoading(false);
            return { error: null };
        } catch (error) {
            setLoading(false);
            return { error: error.message };
        }
    };

    const value = {
        user,
        role,
        profile,
        loading,
        signIn: signInWrapper,
        signOut: signOutWrapper,
        isRecovery,
        setIsRecovery,
        isAdmin: role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
