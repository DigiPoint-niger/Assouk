// Fichier : src/app/dashboard/page.jsx

// Ce fichier est techniquement nécessaire, mais son contenu sera généralement remplacé 
// par la logique de redirection du layout parent. 
// Nous laissons un composant simple au cas où la redirection prendrait du temps.

"use client";
import { FaUserShield } from 'react-icons/fa6';

export default function DashboardHomePage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                <FaUserShield className="text-5xl text-[var(--app-dark-blue)] mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-800">
                    Espace de Tableau de Bord
                </h1>
                <p className="mt-2 text-gray-600">
                    Veuillez patienter, redirection vers votre rôle spécifique en cours...
                </p>
                {/* La redirection est gérée dans le layout parent */}
            </div>
        </div>
    );
}