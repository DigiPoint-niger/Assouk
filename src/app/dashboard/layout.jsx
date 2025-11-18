// Fichier : src/app/dashboard/layout.jsx

"use client";

import { useAuth } from '@/context/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    FaSpinner, 
    FaExclamation, 
    FaCheck, 
    FaSignal, 
    FaUserShield, 
    FaTruck 
} from 'react-icons/fa6';

export default function DashboardRootLayout({ children }) {
    const { user, loading: authLoading, getUserProfile, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [userProfile, setUserProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        // Si l'utilisateur n'est pas connecté, le renvoyer à la page de connexion
        if (!user) {
            router.push('/login');
        } else {
            // Charger le profil de l'utilisateur
            const loadUserProfile = async () => {
                setProfileLoading(true);
                try {
                    const profile = await getUserProfile(user.id);
                    setUserProfile(profile);
                    
                    // Vérifier si l'utilisateur doit être redirigé depuis /dashboard
                    if (pathname === '/dashboard') {
                        if (profile) {
                            // Redirection basée sur le rôle
                            router.replace(`/dashboard/${profile.role}`);
                        } else {
                            // Si pas de profil trouvé, on déconnecte par sécurité
                            alert("Profil introuvable. Déconnexion.");
                            await supabase.auth.signOut();
                            router.push('/login');
                        }
                    }

                    // Vérifier si l'utilisateur n'est pas vérifié (pour les vendeurs et livreurs)
                    if (profile && (profile.role === 'seller' || profile.role === 'deliverer') && !profile.is_verified) {
                        setShowApprovalModal(true);
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement du profil:', error);
                } finally {
                    setProfileLoading(false);
                }
            };

            loadUserProfile();
        }
    }, [user, authLoading, router, pathname, getUserProfile, signOut]);

    // Gérer la déconnexion
    async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');}

    // Obtenir les informations spécifiques au rôle
    const getRoleInfo = () => {
        if (!userProfile) return null;
        
        const role = userProfile.role;
        if (role === 'seller') {
            return {
                title: 'vendeur',
                icon: FaUserShield,
                description: 'Votre compte vendeur est en cours de vérification.',
                process: 'Cette procédure permet de garantir la qualité et la sécurité de notre plateforme pour tous les utilisateurs.'
            };
        } else if (role === 'deliverer') {
            return {
                title: 'livreur',
                icon: FaTruck,
                description: 'Votre compte livreur est en cours de vérification.',
                process: 'Cette procédure permet de valider vos informations pour assurer des livraisons fiables et sécurisées.'
            };
        }
        return null;
    };

    // Écran de chargement initial
    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-2xl bg-gray-100">
                <FaSpinner className="animate-spin mr-3 text-2xl text-[var(--company-blue)]" /> 
                <span className="text-gray-700">Chargement de la session...</span>
            </div>
        );
    }
    
    // Si nous sommes sur /dashboard, on affiche l'écran de chargement jusqu'à la redirection
    if (user && pathname === '/dashboard') {
        return (
            <div className="min-h-screen flex items-center justify-center text-2xl bg-gray-100">
                <FaSpinner className="animate-spin mr-3 text-2xl text-[var(--company-blue)]" /> 
                <span className="text-gray-700">Redirection vers votre tableau de bord...</span>
            </div>
        );
    }

    // Modal d'approbation en attente pour les vendeurs et livreurs non vérifiés
    const roleInfo = getRoleInfo();
    if (showApprovalModal && roleInfo && !userProfile?.is_verified) {
        const RoleIcon = roleInfo.icon;
        
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                {/* Modal d'approbation en attente */}
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <FaExclamation className="text-2xl text-yellow-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        En attente de vérification
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Votre compte {roleInfo.title}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                    <RoleIcon className="text-2xl text-yellow-600" />
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Compte en cours de vérification
                                </h3>
                                
                                <p className="text-gray-600 mb-4">
                                    {roleInfo.description} {roleInfo.process}
                                    Cette procédure peut prendre jusqu'à 48 heures.
                                </p>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                                    <div className="flex items-start gap-3">
                                        <FaCheck className="text-blue-500 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-medium text-blue-800 mb-1">
                                                Prochaines étapes
                                            </h4>
                                            <ul className="text-blue-700 text-sm space-y-1">
                                                <li>• Vérification de vos informations</li>
                                                <li>• Validation de votre éligibilité</li>
                                                <li>• Activation complète du compte</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <strong>Statut actuel :</strong>{' '}
                                        <span className="font-medium text-yellow-600">
                                            En attente de vérification
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Vous recevrez un email de confirmation une fois votre compte vérifié.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaSignal />
                                    Se déconnecter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fond flou avec message */}
                <div className="text-center">
                    <div className="bg-white rounded-lg shadow-sm p-8 max-w-sm mx-auto">
                        <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Vérification du compte
                        </h3>
                        <p className="text-gray-600">
                            Préparation de votre espace {roleInfo.title}...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Affiche le contenu si l'utilisateur est connecté et vérifié (ou non vendeur/livreur)
    return (
        <>
            {children}
            
            {/* Banner d'information pour les vendeurs/livreurs en attente (même après fermeture du modal) */}
            {userProfile && (userProfile.role === 'seller' || userProfile.role === 'deliverer') && !userProfile.is_verified && (
                <div className="fixed top-4 right-4 left-4 md:left-auto md:right-4 md:w-80 z-40">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
                        <div className="flex items-start gap-3">
                            <FaExclamation className="text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-800 text-sm">
                                    Compte en attente de vérification
                                </h4>
                                <p className="text-yellow-700 text-xs mt-1">
                                    {userProfile.role === 'seller' 
                                        ? 'Certaines fonctionnalités vendeur peuvent être limitées jusqu\'à la vérification administrative.'
                                        : 'Certaines fonctionnalités livreur peuvent être limitées jusqu\'à la vérification administrative.'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={() => setShowApprovalModal(true)}
                                className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                            >
                                Détails
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}