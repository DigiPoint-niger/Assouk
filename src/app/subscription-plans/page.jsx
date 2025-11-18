// Fichier : /app/subscription-plans/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    FaCrown,
    FaCheck,
    FaTimes,
    FaSpinner,
    FaStar,
    FaGem,
    FaRocket,
    FaShieldAlt,
    FaInfinity,
    FaShoppingBag,
    FaAd,
    FaWallet,
    FaArrowRight,
    FaUsers
} from "react-icons/fa";
import { useCurrency } from "@/context/CurrencyContext";

// --- Composant PlanCard ---
const PlanCard = ({ plan, isFeatured = false, currentPlan, formatPrice }) => {
    const isCurrentPlan = currentPlan && currentPlan.id === plan.id;
    const priceInSelectedCurrency = plan.price / (useCurrency().getExchangeRate() || 1);
    
    return (
        <div className={`relative rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.02] ${
            isFeatured 
                ? 'bg-gradient-to-br from-[var(--company-blue)] to-[var(--app-dark-blue)] text-white border-2 border-[var(--company-blue)] scale-105' 
                : 'bg-white text-gray-800 border border-gray-200'
        } ${isCurrentPlan ? 'ring-4 ring-[var(--success)] ring-opacity-50' : ''}`}>
            
            {/* Badge Featured */}
            {isFeatured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[var(--company-orange)] text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                        <FaCrown className="text-yellow-300" />
                        Le Plus Populaire
                    </div>
                </div>
            )}

            {/* Badge Current Plan */}
            {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[var(--success)] text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                        <FaCheck />
                        Votre Plan Actuel
                    </div>
                </div>
            )}

            <div className="p-8">
                {/* En-tête du plan */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-full ${
                            isFeatured ? 'bg-white bg-opacity-20' : 'bg-blue-50'
                        }`}>
                            {plan.name === 'Starter' && <FaRocket className="text-2xl" />}
                            {plan.name === 'Pro' && <FaGem className="text-2xl" />}
                            {plan.name === 'Enterprise' && <FaCrown className="text-2xl" />}
                        </div>
                    </div>
                    <h3 className={`text-2xl font-bold ${isFeatured ? 'text-white' : 'text-[var(--app-dark-blue)]'}`}>
                        {plan.name}
                    </h3>
                    <div className="mt-4">
                        <span className={`text-4xl font-bold ${isFeatured ? 'text-white' : 'text-[var(--company-blue)]'}`}>
                            {plan.price === 0 ? 'Gratuit' : formatPrice(plan.price)}
                        </span>
                        {plan.price > 0 && <span className="text-lg opacity-80">/mois</span>}
                    </div>
                </div>

                {/* Liste des fonctionnalités */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                        <FaCheck className={`flex-shrink-0 ${
                            isFeatured ? 'text-white' : 'text-[var(--success)]'
                        }`} />
                        <span className="text-sm">
                            <strong>{plan.max_products}</strong> produits maximum
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <FaCheck className={`flex-shrink-0 ${
                            isFeatured ? 'text-white' : 'text-[var(--success)]'
                        }`} />
                        <span className="text-sm">
                            <strong>{plan.max_ads}</strong> publicités
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <FaCheck className={`flex-shrink-0 ${
                            isFeatured ? 'text-white' : 'text-[var(--success)]'
                        }`} />
                        <span className="text-sm">
                            Solde portefeuille max: <strong>{formatPrice(plan.max_wallet_balance)}</strong>
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <FaCheck className={`flex-shrink-0 ${
                            isFeatured ? 'text-white' : 'text-[var(--success)]'
                        }`} />
                        <span className="text-sm">
                            Support {plan.name === 'Enterprise' ? 'Prioritaire' : 'Standard'}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <FaCheck className={`flex-shrink-0 ${
                            isFeatured ? 'text-white' : 'text-[var(--success)]'
                        }`} />
                        <span className="text-sm">
                            {plan.name === 'Enterprise' ? 'Badge Verified' : 'Badge Standard'}
                        </span>
                    </div>
                </div>

                {/* Bouton d'action */}
                <button
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                        isFeatured 
                            ? 'bg-white text-[var(--company-blue)] hover:bg-gray-100 hover:shadow-lg' 
                            : isCurrentPlan
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-[var(--company-blue)] text-white hover:bg-[var(--app-dark-blue)] hover:shadow-lg'
                    } flex items-center justify-center gap-2`}
                    disabled={isCurrentPlan}
                >
                    {isCurrentPlan ? (
                        'Plan Actuel'
                    ) : (
                        <>
                            Choisir ce plan
                            <FaArrowRight />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- Composant Principal : SubscriptionPlansPage ---
export default function SubscriptionPlansPage() {
    const { formatPrice } = useCurrency();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userSubscription, setUserSubscription] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        
        try {
            // Récupérer l'utilisateur connecté
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Récupérer les plans d'abonnement
            const { data: plansData, error: plansError } = await supabase
                .from("subscription_plans")
                .select("*")
                .order("price", { ascending: true });

            if (plansError) {
                console.error("Erreur de récupération des plans:", plansError);
                setError("Impossible de charger les offres d'abonnement.");
                setLoading(false);
                return;
            }

            setPlans(plansData);

            // Si l'utilisateur est connecté, récupérer son abonnement actuel
            if (user) {
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("subscription_plan")
                    .eq("id", user.id)
                    .single();

                if (!profileError && profileData.subscription_plan) {
                    const { data: subscriptionData, error: subscriptionError } = await supabase
                        .from("subscription_plans")
                        .select("*")
                        .eq("id", profileData.subscription_plan)
                        .single();

                    if (!subscriptionError) {
                        setUserSubscription(subscriptionData);
                    }
                }
            }

        } catch (err) {
            console.error("Erreur générale:", err);
            setError("Une erreur est survenue lors du chargement.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Plans par défaut si la base de données est vide
    const defaultPlans = [
        {
            id: 'starter',
            name: 'Starter',
            price: 0,
            max_products: 50,
            max_ads: 5,
            max_wallet_balance: 100000,
            description: 'Parfait pour débuter'
        },
        {
            id: 'pro',
            name: 'Pro',
            price: 5000,
            max_products: 200,
            max_ads: 20,
            max_wallet_balance: 500000,
            description: 'Idéal pour les professionnels'
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 15000,
            max_products: 1000,
            max_ads: 100,
            max_wallet_balance: 2000000,
            description: 'Pour les entreprises'
        }
    ];

    const displayPlans = plans.length > 0 ? plans : defaultPlans;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-20">
                        <FaSpinner className="animate-spin text-5xl mx-auto text-[var(--company-blue)] mb-4" />
                        <p className="text-xl text-gray-700">Chargement des offres...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* En-tête */}
                <header className="text-center mb-16">
                    <div className="flex justify-center mb-6">
                        <div className="bg-[var(--company-blue)] text-white p-4 rounded-full">
                            <FaCrown className="text-3xl" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--app-dark-blue)] mb-4">
                        Choisissez Votre Plan
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Sélectionnez l'offre qui correspond le mieux à vos besoins. 
                        Tous les plans incluent notre support client dédié.
                    </p>

                    {/* Badge d'abonnement actuel */}
                    {userSubscription && (
                        <div className="mt-6 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                            <FaCheck className="text-green-600" />
                            <span className="font-semibold">
                                Votre plan actuel: <span className="text-[var(--company-blue)]">{userSubscription.name}</span>
                            </span>
                        </div>
                    )}
                </header>

                {/* Grille des plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {displayPlans.map((plan, index) => (
                        <PlanCard 
                            key={plan.id} 
                            plan={plan}
                            isFeatured={index === 1} // Le plan du milieu est mis en avant
                            formatPrice={formatPrice}
                            currentPlan={userSubscription}
                        />
                    ))}
                </div>

                {/* Section caractéristiques */}
                <section className="mt-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-[var(--app-dark-blue)] mb-4">
                            Caractéristiques Incluses
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Tous nos plans incluent ces fonctionnalités essentielles
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="bg-blue-100 text-[var(--company-blue)] p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <FaShieldAlt className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2">Sécurité</h3>
                            <p className="text-gray-600 text-sm">
                                Protection avancée de vos données et transactions
                            </p>
                        </div>

                        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="bg-green-100 text-green-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <FaUsers className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2">Support</h3>
                            <p className="text-gray-600 text-sm">
                                Assistance client dédiée 7j/7
                            </p>
                        </div>

                        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="bg-purple-100 text-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <FaRocket className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2">Performance</h3>
                            <p className="text-gray-600 text-sm">
                                Plateforme optimisée pour de meilleures performances
                            </p>
                        </div>

                        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="bg-orange-100 text-[var(--company-orange)] p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <FaInfinity className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2">Mises à jour</h3>
                            <p className="text-gray-600 text-sm">
                                Accès à toutes les nouvelles fonctionnalités
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section FAQ */}
                <section className="mt-20 max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-[var(--app-dark-blue)] mb-4">
                            Questions Fréquentes
                        </h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 mb-2">
                                    Puis-je changer de plan à tout moment ?
                                </h3>
                                <p className="text-gray-600">
                                    Oui, vous pouvez passer à un plan supérieur à tout moment. La différence de prix sera calculée au prorata.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-gray-800 mb-2">
                                    Y a-t-il des frais cachés ?
                                </h3>
                                <p className="text-gray-600">
                                    Non, tous les prix sont affichés TTC. Aucun frais supplémentaire ne vous sera facturé.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-gray-800 mb-2">
                                    Puis-je annuler mon abonnement ?
                                </h3>
                                <p className="text-gray-600">
                                    Oui, vous pouvez annuler à tout moment. Aucun remboursement n'est possible pour la période en cours.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}