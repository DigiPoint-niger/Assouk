// Fichier : /app/sellers/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { 
    FaUserTie, 
    FaMapMarkerAlt, 
    FaCheckCircle, 
    FaSpinner, 
    FaUsers,
    FaStore
} from "react-icons/fa";

// --- Composant Fonctionnel : SellerCard ---
const SellerCard = ({ seller }) => {
    const isVerified = seller.badge === 'verified';
    
    return (
        <Link 
            href={`/sellers/${seller.id}`} 
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] overflow-hidden border border-gray-100 flex flex-col"
        >
            {/* Image/Avatar (Utilisation d'un placeholder simple pour l'instant) */}
            <div className="h-24 bg-gray-100 flex items-center justify-center relative">
                <FaStore className="text-5xl text-[var(--company-blue)] opacity-50" />
                {/* Avatar du vendeur au centre */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full border-4 border-white shadow-md">
                    <img
                        src={seller.avatar_url || "/default-avatar.png"}
                        alt={`Photo de profil de ${seller.name}`}
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
            </div>

            {/* Contenu de la carte */}
            <div className="pt-12 pb-4 px-4 text-center flex flex-col flex-grow">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-[var(--app-dark-blue)]">{seller.name}</h2>
                    {isVerified && (
                        <FaCheckCircle className="text-base text-[var(--success)]" title="Vendeur Vérifié" />
                    )}
                </div>

                <div className="flex items-center justify-center text-gray-600 mb-3">
                    <FaMapMarkerAlt className="mr-2 text-sm text-[var(--company-orange)]" />
                    <p className="text-sm italic">{seller.city || "Ville non spécifiée"}</p>
                </div>
                
                <div className="mt-auto pt-3 border-t border-gray-100">
                    <span className="text-sm font-semibold text-[var(--company-blue)]">
                        Voir la boutique &rarr;
                    </span>
                </div>
            </div>
        </Link>
    );
};

// --- Composant Principal : SellersPage ---
export default function SellersPage() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction pour récupérer les profils
    // src/app/sellers/page.jsx (Fragment de la fonction fetchSellers)
const fetchSellers = async () => {
    setLoading(true);

    const { data, error } = await supabase
        .from("profiles")
        .select("*") 
        .eq("role", "seller") // S'assurer qu'on filtre par rôle 'seller'
        .order("name", { ascending: true });

    if (error) { // Ligne 82 de l'erreur
        console.error("Erreur de récupération des vendeurs:", error); // <-- Ici l'erreur RLS se produit
        setError("Impossible de charger la liste des vendeurs.");
        setLoading(false);
        return;
    }

    setSellers(data);
    setLoading(false);
};

    useEffect(() => {
        fetchSellers();
    }, []);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-[80vh]">
            <header className="text-center mb-10">
                <FaUsers className="text-4xl mx-auto mb-3 text-[var(--app-dark-blue)]" />
                <h1 className="text-4xl font-extrabold text-[var(--app-dark-blue)] mb-2">
                    Nos Vendeurs Partenaires
                </h1>
                <p className="text-xl text-gray-600">
                    Découvrez les boutiques et les commerçants de la marketplace.
                </p>
            </header>

            {/* Affichage des états */}
            {loading && (
                <div className="text-center py-20">
                    <FaSpinner className="animate-spin text-5xl mx-auto text-[var(--company-blue)]" />
                    <p className="mt-4 text-lg text-gray-700">Chargement des boutiques...</p>
                </div>
            )}

            {error && (
                <div className="text-center py-20 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-lg text-red-600 font-semibold">{error}</p>
                </div>
            )}

            {!loading && !error && sellers.length === 0 && (
                <div className="text-center py-20 bg-gray-100 rounded-lg">
                    <p className="text-lg text-gray-600 font-semibold">
                        Aucun vendeur n'est enregistré pour le moment.
                    </p>
                </div>
            )}

            {/* Grille des vendeurs */}
            {!loading && sellers.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sellers.map((seller) => (
                        <SellerCard key={seller.id} seller={seller} />
                    ))}
                </div>
            )}
        </div>
    );
}