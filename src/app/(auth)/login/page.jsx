// Fichier : /(auth)/login/page.jsx

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaSignInAlt, FaEnvelope, FaLock, FaSpinner } from "react-icons/fa";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        // Redirection simple vers /dashboard. 
        // Le composant /dashboard/page.jsx s'occupera de la redirection basée sur le rôle.
        router.push("/dashboard");
        // NOTE: setLoading reste à true jusqu'à ce que la page dashboard prenne le relais.
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-t-4 border-[var(--app-dark-blue)]">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--app-dark-blue)]">
                        Connectez-vous à ASSOUK
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Pas de compte ?
                        <Link href="/signup" className="font-medium text-[var(--company-blue)] hover:text-blue-700 ml-1">
                            Créez-en un ici
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}

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
                                className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[var(--app-dark-blue)] focus:border-[var(--app-dark-blue)] sm:text-sm"
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
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mot de passe"
                                className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[var(--app-dark-blue)] focus:border-[var(--app-dark-blue)] sm:text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-app hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--app-dark-blue)] disabled:opacity-50"
                    >
                        {loading ? (
                            <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        ) : (
                            <FaSignInAlt className="h-5 w-5 mr-2" />
                        )}
                        {loading ? "Connexion en cours..." : "Se connecter"}
                    </button>
                </form>
            </div>
        </div>
    );
}