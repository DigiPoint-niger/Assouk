// Fichier : src/app/dashboard/admin/plans/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaCrown,
    FaMoneyBillWave,
    FaBox,
    FaBullhorn,
    FaWallet,
    FaTimesCircle,
    FaCheckCircle,
    FaUsers,
    FaStar,
    FaTruck
} from 'react-icons/fa';

export default function PlansManagement() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [newPlan, setNewPlan] = useState({
        name: '',
        price: 0,
        max_products: 50,
        max_ads: 5,
        max_wallet_balance: 100000,
        max_concurrent_deliveries: 5
    });
    const [userCounts, setUserCounts] = useState({});

    // Charger les plans d'abonnement
    const fetchPlans = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price', { ascending: true });

            if (error) throw error;
            setPlans(data || []);

            // Récupérer le nombre d'utilisateurs par plan
            await fetchUserCounts();
        } catch (error) {
            console.error('Erreur lors du chargement des plans:', error);
        } finally {
            setLoading(false);
        }
    };

    // Récupérer le nombre d'utilisateurs par plan
    const fetchUserCounts = async () => {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('subscription_plan');

            if (error) throw error;

            const counts = {};
            users.forEach(user => {
                if (user.subscription_plan) {
                    counts[user.subscription_plan] = (counts[user.subscription_plan] || 0) + 1;
                }
            });

            setUserCounts(counts);
        } catch (error) {
            console.error('Erreur lors du comptage des utilisateurs:', error);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    // Filtrer les plans
    const filteredPlans = plans.filter(plan => 
        plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Créer un nouveau plan
    const createPlan = async () => {
        if (!newPlan.name.trim()) {
            alert('Le nom du plan est obligatoire');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .insert([{
                    name: newPlan.name,
                    price: parseFloat(newPlan.price),
                    max_products: parseInt(newPlan.max_products),
                    max_ads: parseInt(newPlan.max_ads),
                    max_wallet_balance: parseFloat(newPlan.max_wallet_balance),
                    max_concurrent_deliveries: parseInt(newPlan.max_concurrent_deliveries)
                }])
                .select()
                .single();

            if (error) throw error;

            setPlans([...plans, data]);
            setIsCreateModalOpen(false);
            setNewPlan({
                name: '',
                price: 0,
                max_products: 50,
                max_ads: 5,
                max_wallet_balance: 100000,
                max_concurrent_deliveries: 5
            });
        } catch (error) {
            console.error('Erreur lors de la création du plan:', error);
            alert('Erreur lors de la création du plan');
        }
    };

    // Mettre à jour un plan
    const updatePlan = async () => {
        if (!editingPlan.name.trim()) {
            alert('Le nom du plan est obligatoire');
            return;
        }

        try {
            const { error } = await supabase
                .from('subscription_plans')
                .update({
                    name: editingPlan.name,
                    price: parseFloat(editingPlan.price),
                    max_products: parseInt(editingPlan.max_products),
                    max_ads: parseInt(editingPlan.max_ads),
                    max_wallet_balance: parseFloat(editingPlan.max_wallet_balance),
                    max_concurrent_deliveries: parseInt(editingPlan.max_concurrent_deliveries)
                })
                .eq('id', editingPlan.id);

            if (error) throw error;

            setPlans(plans.map(plan => 
                plan.id === editingPlan.id ? editingPlan : plan
            ));
            setIsEditModalOpen(false);
            setEditingPlan(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du plan:', error);
            alert('Erreur lors de la mise à jour du plan');
        }
    };

    // Supprimer un plan
    const deletePlan = async (planId, planName) => {
        // Vérifier si le plan est utilisé par des utilisateurs
        if (userCounts[planId] > 0) {
            alert(`Impossible de supprimer le plan "${planName}" car il est utilisé par ${userCounts[planId]} utilisateur(s). Veuillez d'abord modifier les abonnements des utilisateurs.`);
            return;
        }

        if (!confirm(`Êtes-vous sûr de vouloir supprimer le plan "${planName}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', planId);

            if (error) throw error;

            setPlans(plans.filter(plan => plan.id !== planId));
        } catch (error) {
            console.error('Erreur lors de la suppression du plan:', error);
            alert('Erreur lors de la suppression du plan');
        }
    };

    // Ouvrir le modal d'édition
    const openEditModal = (plan) => {
        setEditingPlan({ ...plan });
        setIsEditModalOpen(true);
    };

    // Formater le prix
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(price);
    };

    // Obtenir l'icône du plan selon son nom
    const getPlanIcon = (planName) => {
        if (planName.toLowerCase().includes('starter') || planName.toLowerCase().includes('débutant')) {
            return FaStar;
        } else if (planName.toLowerCase().includes('pro') || planName.toLowerCase().includes('professionnel')) {
            return FaCrown;
        } else if (planName.toLowerCase().includes('enterprise') || planName.toLowerCase().includes('entreprise')) {
            return FaUsers;
        } else if (planName.toLowerCase().includes('gratuit') || planName.toLowerCase().includes('free')) {
            return FaMoneyBillWave;
        }
        return FaCrown;
    };

    // Obtenir la couleur du plan selon son prix
    const getPlanColor = (price) => {
        if (price === 0) return 'bg-green-100 text-green-800 border-green-200';
        if (price < 10000) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (price < 20000) return 'bg-purple-100 text-purple-800 border-purple-200';
        return 'bg-orange-100 text-orange-800 border-orange-200';
    };

    // Obtenir la description des limites du plan
    const getPlanLimitsDescription = (plan) => {
        const limits = [];
        
        if (plan.max_products > 0) {
            limits.push(`${plan.max_products} produits`);
        }
        
        if (plan.max_ads > 0) {
            limits.push(`${plan.max_ads} publicités`);
        }
        
        if (plan.max_concurrent_deliveries > 0) {
            limits.push(`${plan.max_concurrent_deliveries} livraisons simultanées`);
        }
        
        if (plan.max_wallet_balance > 0) {
            limits.push(`Portefeuille: ${formatPrice(plan.max_wallet_balance)}`);
        }
        
        return limits.join(' • ');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des plans...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Plans d'Abonnement</h1>
                        <p className="text-gray-600 mt-1">
                            Gérez les plans pour les vendeurs et livreurs - {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} trouvé{filteredPlans.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Barre de recherche */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un plan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                        
                        {/* Bouton d'ajout */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-[var(--company-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                        >
                            <FaPlus />
                            Nouveau Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Cartes des plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((plan) => {
                    const PlanIcon = getPlanIcon(plan.name);
                    const userCount = userCounts[plan.id] || 0;
                    
                    return (
                        <div key={plan.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-transform hover:scale-105 hover:shadow-lg ${getPlanColor(plan.price)}`}>
                            {/* En-tête de la carte */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <PlanIcon className="text-2xl" />
                                        <h3 className="text-xl font-bold">{plan.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">
                                            {plan.price === 0 ? 'Gratuit' : formatPrice(plan.price)}
                                        </div>
                                        {plan.price > 0 && <div className="text-sm opacity-75">/ mois</div>}
                                    </div>
                                </div>
                                
                                {/* Description des limites */}
                                <div className="text-sm opacity-75 mb-3">
                                    {getPlanLimitsDescription(plan)}
                                </div>
                                
                                {/* Nombre d'utilisateurs */}
                                <div className="flex items-center gap-2 text-sm">
                                    <FaUsers className="opacity-75" />
                                    <span>{userCount} utilisateur{userCount !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            {/* Détails du plan */}
                            <div className="p-6 space-y-4 bg-white">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <FaBox className="text-blue-500" />
                                        <div>
                                            <div className="text-sm">Produits max</div>
                                            <div className="font-semibold text-gray-800">{plan.max_products}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <FaBullhorn className="text-purple-500" />
                                        <div>
                                            <div className="text-sm">Publicités max</div>
                                            <div className="font-semibold text-gray-800">{plan.max_ads}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <FaTruck className="text-orange-500" />
                                        <div>
                                            <div className="text-sm">Livraisons simult.</div>
                                            <div className="font-semibold text-gray-800">{plan.max_concurrent_deliveries || 5}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <FaWallet className="text-green-500" />
                                        <div>
                                            <div className="text-sm">Solde max</div>
                                            <div className="font-semibold text-gray-800">{formatPrice(plan.max_wallet_balance)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => openEditModal(plan)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        <FaEdit />
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => deletePlan(plan.id, plan.name)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 transition-colors"
                                        disabled={userCount > 0}
                                        title={userCount > 0 ? `Ce plan est utilisé par ${userCount} utilisateur(s)` : 'Supprimer le plan'}
                                    >
                                        <FaTrash className={userCount > 0 ? 'opacity-50' : ''} />
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredPlans.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <FaCrown className="mx-auto text-4xl text-gray-400 mb-3" />
                    <p className="text-gray-500 text-lg">
                        {searchTerm
                            ? "Aucun plan ne correspond aux critères de recherche."
                            : "Aucun plan d'abonnement n'a été créé pour le moment."
                        }
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 flex items-center gap-2 bg-[var(--company-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors mx-auto"
                        >
                            <FaPlus />
                            Créer le premier plan
                        </button>
                    )}
                </div>
            )}

            {/* Modal de création de plan */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Nouveau Plan d'Abonnement
                                </h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom du plan *
                                </label>
                                <input
                                    type="text"
                                    value={newPlan.name}
                                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                                    placeholder="Ex: Starter, Pro, Enterprise..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prix (FCFA) *
                                </label>
                                <input
                                    type="number"
                                    value={newPlan.price}
                                    onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                                    min="0"
                                    step="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Mettez 0 pour un plan gratuit
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Produits max
                                    </label>
                                    <input
                                        type="number"
                                        value={newPlan.max_products}
                                        onChange={(e) => setNewPlan({...newPlan, max_products: e.target.value})}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Publicités max
                                    </label>
                                    <input
                                        type="number"
                                        value={newPlan.max_ads}
                                        onChange={(e) => setNewPlan({...newPlan, max_ads: e.target.value})}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Livraisons simultanées
                                    </label>
                                    <input
                                        type="number"
                                        value={newPlan.max_concurrent_deliveries}
                                        onChange={(e) => setNewPlan({...newPlan, max_concurrent_deliveries: e.target.value})}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Pour les livreurs
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Solde max (FCFA)
                                    </label>
                                    <input
                                        type="number"
                                        value={newPlan.max_wallet_balance}
                                        onChange={(e) => setNewPlan({...newPlan, max_wallet_balance: e.target.value})}
                                        min="0"
                                        step="1000"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={createPlan}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Créer le plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition de plan */}
            {isEditModalOpen && editingPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Modifier le Plan
                                </h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom du plan *
                                </label>
                                <input
                                    type="text"
                                    value={editingPlan.name}
                                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prix (FCFA) *
                                </label>
                                <input
                                    type="number"
                                    value={editingPlan.price}
                                    onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                                    min="0"
                                    step="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Produits max
                                    </label>
                                    <input
                                        type="number"
                                        value={editingPlan.max_products}
                                        onChange={(e) => setEditingPlan({...editingPlan, max_products: e.target.value})}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Publicités max
                                    </label>
                                    <input
                                        type="number"
                                        value={editingPlan.max_ads}
                                        onChange={(e) => setEditingPlan({...editingPlan, max_ads: e.target.value})}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Livraisons simultanées
                                    </label>
                                    <input
                                        type="number"
                                        value={editingPlan.max_concurrent_deliveries || 5}
                                        onChange={(e) => setEditingPlan({...editingPlan, max_concurrent_deliveries: e.target.value})}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Pour les livreurs
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Solde max (FCFA)
                                    </label>
                                    <input
                                        type="number"
                                        value={editingPlan.max_wallet_balance}
                                        onChange={(e) => setEditingPlan({...editingPlan, max_wallet_balance: e.target.value})}
                                        min="0"
                                        step="1000"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={updatePlan}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Enregistrer les modifications
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}