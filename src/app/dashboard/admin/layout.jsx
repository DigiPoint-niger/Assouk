// Fichier : src/app/dashboard/admin/layout.jsx

"use client";

import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import { FaSpinner, FaBars } from 'react-icons/fa6';

// Rôle de l'administrateur
const REQUIRED_ROLE = 'admin'; 

export default function AdminDashboardLayout({ children }) {
    const { user, loading: authLoading, getUserProfile } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);
    
    // Fonction pour basculer l'état de la sidebar
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    useEffect(() => {
        const checkAccess = async () => {
            if (authLoading) return;

            if (!user) {
                // Redirige vers la page de connexion si non connecté
                router.push('/login');
                return;
            }

            // Vérification du rôle
            const profile = await getUserProfile(user.id);
            if (!profile || profile.role !== REQUIRED_ROLE) {
                // Redirige si le rôle est incorrect
                alert("Accès refusé. Vous n'avez pas les droits d'administrateur.");
                router.push('/'); 
            } else {
                setHasAccess(true);
            }
            setCheckingAccess(false);
        };

        checkAccess();
    }, [user, authLoading, router, getUserProfile]);

    // Écran de chargement/vérification
    if (authLoading || checkingAccess || !hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center text-2xl bg-gray-100">
                <FaSpinner className="animate-spin mr-3 text-[var(--company-blue)]" /> 
                {authLoading ? "Vérification de l'authentification..." : 
                 checkingAccess ? "Vérification des droits d'accès..." : 
                 "Redirection..."}
            </div>
        );
    }

    // Affichage du Layout Admin
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar - toujours caché par défaut */}
            <AdminSidebar 
                isOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar} 
            />

            {/* Contenu principal - plus de marge gauche fixe */}
            <main className="flex-grow p-4 lg:p-8 transition-all duration-300 w-full">
                
                {/* Header avec bouton menu toujours visible */}
                <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-md">
                    <button 
                        onClick={toggleSidebar} 
                        className="p-2 text-2xl text-[var(--app-dark-blue)] hover:bg-gray-200 rounded-lg"
                        aria-label="Ouvrir le menu"
                    >
                        <FaBars />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Tableau de Bord Administrateur
                    </h1>
                    {/* Espace vide pour l'équilibre visuel */}
                    <div className="w-10"></div>
                </header>
                
                {children}
            </main>
        </div>
    );
}