'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getUserProfile, signIn, signOut, resetPassword as apiResetPassword, updatePassword as apiUpdatePassword } from '@/lib/supabase/auth';

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
                const savedUser = localStorage.getItem('isantuni_user');
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);

                    const savedProfile = localStorage.getItem('isantuni_profile');
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
                            localStorage.setItem('isantuni_profile', JSON.stringify(freshProfile));
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
                localStorage.setItem('isantuni_user', JSON.stringify(userObj));

                // Profile handling (Flat vs Nested)
                const userProfile = result.user.profile || result.user;
                if (userProfile) {
                    setProfile(userProfile);
                    setRole(userProfile.role || 'editor');
                    localStorage.setItem('isantuni_profile', JSON.stringify(userProfile));
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
            localStorage.removeItem('isantuni_user');
            localStorage.removeItem('isantuni_role');
            localStorage.removeItem('isantuni_profile');
            setLoading(false);
            return { error: null };
        } catch (error) {
            setLoading(false);
            return { error: error.message };
        }
    };

    const resetPasswordWrapper = async (email) => {
        try {
            return await apiResetPassword(email);
        } catch (error) {
            return { error: error.message };
        }
    };

    const updatePasswordWrapper = async (email, token, newPassword) => {
        try {
            return await apiUpdatePassword(email, token, newPassword);
        } catch (error) {
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
        resetPassword: resetPasswordWrapper,
        updatePassword: updatePasswordWrapper,
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
