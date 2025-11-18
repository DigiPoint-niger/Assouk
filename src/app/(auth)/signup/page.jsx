// Fichier : /(auth)/signup/page.jsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { FaUserPlus, FaEnvelope, FaLock, FaUserTag, FaSpinner, FaExclamationTriangle, FaStore, FaTruck, FaUser } from "react-icons/fa";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("client"); // Rôle par défaut
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [platformSettings, setPlatformSettings] = useState(null);
    const [settingsLoading, setSettingsLoading] = useState(true);

    // Charger les paramètres de la plateforme
    useEffect(() => {
        const fetchPlatformSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('platform_settings')
                    .select('*');

                if (error) throw error;

                // Convertir les paramètres en objet
                const settings = {};
                if (data) {
                    data.forEach(setting => {
                        if (setting.value === 'true' || setting.value === 'false') {
                            settings[setting.key] = setting.value === 'true';
                        } else {
                            settings[setting.key] = setting.value;
                        }
                    });
                }

                setPlatformSettings(settings);
            } catch (error) {
                console.error('Erreur lors du chargement des paramètres:', error);
                // Paramètres par défaut en cas d'erreur
                setPlatformSettings({
                    platform_enabled: true,
                    seller_registration_enabled: true,
                    deliverer_registration_enabled: true,
                    client_registration_enabled: true
                });
            } finally {
                setSettingsLoading(false);
            }
        };

        fetchPlatformSettings();
    }, []);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        // Vérifier si le rôle est autorisé
        if (!isRoleEnabled(role)) {
            setError(`Les inscriptions pour les ${getRoleLabel(role)} sont temporairement désactivées.`);
            setLoading(false);
            return;
        }

        // 1. Inscription Supabase
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        // 2. Création du profil initial
        if (data.user) {
            const { error: profileError } = await supabase.from("profiles").insert([
                {
                    id: data.user.id,
                    name: name,
                    role: role,
                    is_verified: false, // L'e-mail n'est pas encore confirmé
                },
            ]);

            if (profileError) {
                console.error("Erreur de création de profil:", profileError);
            }
            
            // 3. Message de succès et invitation à la confirmation
            setSuccessMessage("Inscription réussie ! Veuillez vérifier votre boîte de réception pour confirmer votre adresse e-mail avant de vous connecter.");
        }
        
        setLoading(false);
    };

    // Vérifier si un rôle est activé
    const isRoleEnabled = (role) => {
        if (!platformSettings) return true;

        switch (role) {
            case 'client':
                return platformSettings.client_registration_enabled;
            case 'seller':
                return platformSettings.seller_registration_enabled;
            case 'deliverer':
                return platformSettings.deliverer_registration_enabled;
            default:
                return true;
        }
    };

    // Obtenir le label d'un rôle
    const getRoleLabel = (role) => {
        switch (role) {
            case 'client': return 'clients';
            case 'seller': return 'vendeurs';
            case 'deliverer': return 'livreurs';
            default: return 'utilisateurs';
        }
    };

    // Obtenir l'icône d'un rôle
    const getRoleIcon = (role) => {
        switch (role) {
            case 'client': return <FaUser className="inline mr-2" />;
            case 'seller': return <FaStore className="inline mr-2" />;
            case 'deliverer': return <FaTruck className="inline mr-2" />;
            default: return <FaUserTag className="inline mr-2" />;
        }
    };

    // Obtenir la description d'un rôle
    const getRoleDescription = (role) => {
        switch (role) {
            case 'client': return 'Achetez des produits et faites-vous livrer';
            case 'seller': return 'Vendez vos produits sur la plateforme';
            case 'deliverer': return 'Livrez les commandes et gagnez de l\'argent';
            default: return '';
        }
    };

    if (settingsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-t-4 border-[var(--company-blue)] text-center">
                    <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mx-auto mb-4" />
                    <p className="text-gray-600">Chargement des paramètres...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-t-4 border-[var(--company-blue)]">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--app-dark-blue)]">
                        Créer un Compte ASSOUK
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Déjà inscrit ?
                        <Link href="/login" className="font-medium text-[var(--company-green)] hover:text-green-700 ml-1">
                            Connectez-vous ici
                        </Link>
                    </p>
                </div>
                
                {successMessage ? (
                    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
                        <p className="font-bold mb-2">🎉 Succès !</p>
                        <p>{successMessage}</p>
                        <p className="mt-2 text-sm">Merci de vérifier votre dossier SPAM si vous ne trouvez pas l'e-mail.</p>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Avertissement si certaines inscriptions sont désactivées */}
                        {platformSettings && (
                            (!platformSettings.client_registration_enabled || 
                             !platformSettings.seller_registration_enabled || 
                             !platformSettings.deliverer_registration_enabled) && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <div className="flex items-start gap-2">
                                        <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-yellow-800 text-sm font-medium">
                                                Inscriptions limitées
                                            </p>
                                            <p className="text-yellow-700 text-xs mt-1">
                                                Certains types de comptes sont temporairement indisponibles à l'inscription.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                        
                        {/* Champ Nom */}
                        <div>
                            <label htmlFor="name" className="sr-only">Nom complet</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <FaUserPlus />
                                </span>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nom complet"
                                    className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[var(--company-blue)] focus:border-[var(--company-blue)] sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Champ Email */}
                        <div>
                            <label htmlFor="email" className="sr-only">Adresse email</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <FaEnvelope />
                                </span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Adresse email"
                                    className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[var(--company-blue)] focus:border-[var(--company-blue)] sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Champ Mot de passe */}
                        <div>
                            <label htmlFor="password" className="sr-only">Mot de passe</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <FaLock />
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mot de passe"
                                    className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[var(--company-blue)] focus:border-[var(--company-blue)] sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Sélection du Rôle */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                <FaUserTag className="inline mr-1" /> Je veux m'inscrire en tant que :
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-[var(--company-blue)] focus:border-[var(--company-blue)] sm:text-sm"
                            >
                                <option value="client" disabled={!platformSettings?.client_registration_enabled}>
                                    Client (Acheter)
                                </option>
                                <option value="seller" disabled={!platformSettings?.seller_registration_enabled}>
                                    Vendeur (Vendre)
                                </option>
                                <option value="deliverer" disabled={!platformSettings?.deliverer_registration_enabled}>
                                    Livreur (Livrer)
                                </option>
                            </select>
                            
                            {/* Description du rôle sélectionné */}
                            <div className={`mt-2 p-3 rounded-md ${
                                isRoleEnabled(role) ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'
                            }`}>
                                <div className="flex items-start gap-2">
                                    {isRoleEnabled(role) ? (
                                        <>
                                            {getRoleIcon(role)}
                                            <div>
                                                <p className="text-blue-800 text-sm font-medium">
                                                    {getRoleLabel(role).charAt(0).toUpperCase() + getRoleLabel(role).slice(1)}
                                                </p>
                                                <p className="text-blue-700 text-xs mt-1">
                                                    {getRoleDescription(role)}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-red-800 text-sm font-medium">
                                                    Inscriptions désactivées
                                                </p>
                                                <p className="text-red-700 text-xs mt-1">
                                                    Les inscriptions pour les {getRoleLabel(role)} sont temporairement désactivées.
                                                    Veuillez choisir un autre type de compte.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isRoleEnabled(role)}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--company-blue)] ${
                                loading || !isRoleEnabled(role)
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'btn-primary hover:opacity-90'
                            }`}
                        >
                            {loading ? (
                                <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            ) : (
                                <FaUserPlus className="h-5 w-5 mr-2" />
                            )}
                            {loading 
                                ? "Inscription en cours..." 
                                : !isRoleEnabled(role)
                                    ? `Inscriptions ${getRoleLabel(role)} désactivées`
                                    : "S'inscrire"
                            }
                        </button>

                        {/* Résumé des inscriptions disponibles */}
                        {platformSettings && (
                            <div className="text-center text-xs text-gray-500 border-t pt-4">
                                <p className="font-medium mb-2">Inscriptions disponibles :</p>
                                <div className="flex justify-center gap-4">
                                    <span className={`flex items-center gap-1 ${platformSettings.client_registration_enabled ? 'text-green-600' : 'text-red-500'}`}>
                                        <FaUser className="text-xs" />
                                        Clients
                                    </span>
                                    <span className={`flex items-center gap-1 ${platformSettings.seller_registration_enabled ? 'text-green-600' : 'text-red-500'}`}>
                                        <FaStore className="text-xs" />
                                        Vendeurs
                                    </span>
                                    <span className={`flex items-center gap-1 ${platformSettings.deliverer_registration_enabled ? 'text-green-600' : 'text-red-500'}`}>
                                        <FaTruck className="text-xs" />
                                        Livreurs
                                    </span>
                                </div>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}