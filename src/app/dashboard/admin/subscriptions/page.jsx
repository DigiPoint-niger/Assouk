// Fichier : src/app/dashboard/admin/subscriptions/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSearch,
    FaBox,
    FaEye,
    FaEdit,
    FaSpinner,
    FaUser,
    FaCrown,
    FaMoneyBillWave,
    FaTimesCircle,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSync,
    FaChartLine
} from 'react-icons/fa';

export default function SubscriptionsManagement() {
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [stats, setStats] = useState({});

    // Statuts des abonnements
    const subscriptionStatuses = [
        { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-800' },
        { value: 'inactive', label: 'Inactif', color: 'bg-gray-100 text-gray-800' },
        { value: 'expired', label: 'Expiré', color: 'bg-red-100 text-red-800' },
        { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' }
    ];

    // Charger les utilisateurs avec leurs abonnements et statistiques
    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Récupérer les plans d'abonnement
            const { data: plansData, error: plansError } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price', { ascending: true });

            if (plansError) throw plansError;
            setPlans(plansData || []);

            // Récupérer les utilisateurs avec leurs plans
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    subscription_plan:subscription_plans(*)
                `)
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Calculer les statistiques
            calculateStats(usersData, plansData);

            setUsers(usersData || []);
        } catch (error) {
            console.error('Erreur lors du chargement des abonnements:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculer les statistiques
    const calculateStats = (usersData, plansData) => {
        const stats = {
            totalUsers: usersData?.length || 0,
            subscribedUsers: 0,
            freeUsers: 0,
            revenue: 0,
            plansDistribution: {}
        };

        usersData?.forEach(user => {
            if (user.subscription_plan) {
                stats.subscribedUsers++;
                stats.revenue += user.subscription_plan.price || 0;
                
                // Distribution par plan
                const planName = user.subscription_plan.name;
                stats.plansDistribution[planName] = (stats.plansDistribution[planName] || 0) + 1;
            } else {
                stats.freeUsers++;
            }
        });

        setStats(stats);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filtrer les utilisateurs
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPlan = planFilter === 'all' || 
            (planFilter === 'free' && !user.subscription_plan) ||
            (planFilter === 'paid' && user.subscription_plan) ||
            (planFilter !== 'free' && planFilter !== 'paid' && user.subscription_plan?.id === planFilter);
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && user.subscription_plan) ||
            (statusFilter === 'inactive' && !user.subscription_plan);
        
        return matchesSearch && matchesPlan && matchesStatus;
    });

    // Mettre à jour l'abonnement d'un utilisateur
    const updateUserSubscription = async (userId, newPlanId) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_plan: newPlanId || null })
                .eq('id', userId);

            if (error) throw error;

            // Mettre à jour l'état local
            const updatedUsers = users.map(user => {
                if (user.id === userId) {
                    const newPlan = plans.find(plan => plan.id === newPlanId);
                    return {
                        ...user,
                        subscription_plan: newPlan || null
                    };
                }
                return user;
            });

            setUsers(updatedUsers);
            calculateStats(updatedUsers, plans);
            setIsEditModalOpen(false);
            setEditingSubscription(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
            alert('Erreur lors de la mise à jour de l\'abonnement');
        }
    };

    // Révoquer un abonnement
    const revokeSubscription = async (userId, userName) => {
        if (!confirm(`Êtes-vous sûr de vouloir révoquer l'abonnement de "${userName}" ?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_plan: null })
                .eq('id', userId);

            if (error) throw error;

            // Mettre à jour l'état local
            const updatedUsers = users.map(user => 
                user.id === userId ? { ...user, subscription_plan: null } : user
            );

            setUsers(updatedUsers);
            calculateStats(updatedUsers, plans);
        } catch (error) {
            console.error('Erreur lors de la révocation de l\'abonnement:', error);
            alert('Erreur lors de la révocation de l\'abonnement');
        }
    };

    // Afficher les détails d'un utilisateur
    const viewUserDetails = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    // Ouvrir le modal d'édition d'abonnement
    const openEditModal = (user) => {
        setEditingSubscription({
            userId: user.id,
            userName: user.name,
            currentPlan: user.subscription_plan,
            newPlanId: user.subscription_plan?.id || null
        });
        setIsEditModalOpen(true);
    };

    // Obtenir le statut de l'abonnement
    const getSubscriptionStatus = (user) => {
        if (!user.subscription_plan) return 'inactive';
        return 'active'; // Dans une implémentation réelle, vous vérifieriez la date d'expiration
    };

    // Formater le prix
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(price);
    };

    // Obtenir l'icône du statut
    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <FaCheckCircle className="text-green-500" />;
            case 'inactive': return <FaTimesCircle className="text-gray-400" />;
            case 'expired': return <FaExclamationTriangle className="text-red-500" />;
            case 'pending': return <FaSync className="text-yellow-500 animate-spin" />;
            default: return <FaUser className="text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des abonnements...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Abonnements</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    {/* Barre de recherche et filtres */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un utilisateur..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                        
                        <select
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            <option value="all">Tous les plans</option>
                            <option value="free">Gratuit</option>
                            <option value="paid">Payant</option>
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                        </div>
                        <FaUser className="text-3xl text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Abonnés Actifs</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.subscribedUsers}</p>
                            <p className="text-sm text-gray-500">
                                {stats.totalUsers > 0 ? Math.round((stats.subscribedUsers / stats.totalUsers) * 100) : 0}% du total
                            </p>
                        </div>
                        <FaCrown className="text-3xl text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Utilisateurs Gratuits</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.freeUsers}</p>
                        </div>
                        <FaUser className="text-3xl text-yellow-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Revenus Mensuels</p>
                            <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.revenue || 0)}</p>
                        </div>
                        <FaMoneyBillWave className="text-3xl text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Tableau des abonnements */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rôle
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plan Actuel
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date d'inscription
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => {
                                const status = getSubscriptionStatus(user);
                                const statusInfo = subscriptionStatuses.find(s => s.value === status) || subscriptionStatuses[1];
                                
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <FaUser className="text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {user.id.slice(-8)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{user.phone || 'Non renseigné'}</div>
                                            <div className="text-sm text-gray-500">{user.email || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                user.role === 'seller' ? 'bg-green-100 text-green-800' :
                                                user.role === 'deliverer' ? 'bg-purple-100 text-purple-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {user.role === 'admin' ? 'Administrateur' :
                                                 user.role === 'seller' ? 'Vendeur' :
                                                 user.role === 'deliverer' ? 'Livreur' : 'Client'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.subscription_plan ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.subscription_plan.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.subscription_plan.price === 0 ? 'Gratuit' : formatPrice(user.subscription_plan.price)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">Aucun abonnement</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(status)}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => viewUserDetails(user)}
                                                    className="text-[var(--company-blue)] hover:text-[var(--app-dark-blue)] transition-colors"
                                                    title="Voir les détails"
                                                >
                                                    <FaEye className="text-lg" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="text-green-600 hover:text-green-800 transition-colors"
                                                    title="Modifier l'abonnement"
                                                >
                                                    <FaEdit className="text-lg" />
                                                </button>
                                                {user.subscription_plan && (
                                                    <button
                                                        onClick={() => revokeSubscription(user.id, user.name)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                        title="Révoquer l'abonnement"
                                                    >
                                                        <FaTimesCircle className="text-lg" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <FaCrown className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm || planFilter !== 'all' || statusFilter !== 'all'
                                ? "Aucun utilisateur ne correspond aux critères de recherche."
                                : "Aucun utilisateur n'est inscrit pour le moment."
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de détails de l'utilisateur */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Détails de l'abonnement
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Informations utilisateur */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations utilisateur</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedUser.name}</p>
                                        <p><strong>Email:</strong> {selectedUser.email || 'Non disponible'}</p>
                                        <p><strong>Téléphone:</strong> {selectedUser.phone || 'Non renseigné'}</p>
                                        <p><strong>Rôle:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                selectedUser.role === 'seller' ? 'bg-green-100 text-green-800' :
                                                selectedUser.role === 'deliverer' ? 'bg-purple-100 text-purple-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {selectedUser.role === 'admin' ? 'Administrateur' :
                                                 selectedUser.role === 'seller' ? 'Vendeur' :
                                                 selectedUser.role === 'deliverer' ? 'Livreur' : 'Client'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations abonnement</h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <strong>Statut:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                getSubscriptionStatus(selectedUser) === 'active' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {getSubscriptionStatus(selectedUser) === 'active' ? 'Actif' : 'Inactif'}
                                            </span>
                                        </p>
                                        <p><strong>Plan:</strong> {selectedUser.subscription_plan?.name || 'Aucun'}</p>
                                        <p><strong>Prix:</strong> {selectedUser.subscription_plan ? formatPrice(selectedUser.subscription_plan.price) : 'Gratuit'}</p>
                                        <p><strong>Date d'inscription:</strong> {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Limites du plan */}
                            {selectedUser.subscription_plan && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Limites du plan</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                                            <FaBox className="text-blue-600 mx-auto mb-2" />
                                            <div className="text-lg font-bold text-blue-600">{selectedUser.subscription_plan.max_products}</div>
                                            <div className="text-sm text-blue-800">Produits max</div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg text-center">
                                            <FaChartLine className="text-green-600 mx-auto mb-2" />
                                            <div className="text-lg font-bold text-green-600">{selectedUser.subscription_plan.max_ads}</div>
                                            <div className="text-sm text-green-800">Publicités max</div>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                                            <FaMoneyBillWave className="text-purple-600 mx-auto mb-2" />
                                            <div className="text-lg font-bold text-purple-600">{formatPrice(selectedUser.subscription_plan.max_wallet_balance)}</div>
                                            <div className="text-sm text-purple-800">Solde max</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => openEditModal(selectedUser)}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Modifier l'abonnement
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition d'abonnement */}
            {isEditModalOpen && editingSubscription && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Modifier l'abonnement
                                </h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Utilisateur: {editingSubscription.userName}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Plan d'abonnement
                                </label>
                                <select
                                    value={editingSubscription.newPlanId || ''}
                                    onChange={(e) => setEditingSubscription({
                                        ...editingSubscription,
                                        newPlanId: e.target.value || null
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                >
                                    <option value="">Aucun abonnement (Gratuit)</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - {plan.price === 0 ? 'Gratuit' : formatPrice(plan.price)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {editingSubscription.newPlanId && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 mb-2">Détails du plan sélectionné:</h4>
                                    {(() => {
                                        const selectedPlan = plans.find(plan => plan.id === editingSubscription.newPlanId);
                                        return selectedPlan ? (
                                            <div className="text-sm space-y-1">
                                                <p><strong>Produits max:</strong> {selectedPlan.max_products}</p>
                                                <p><strong>Publicités max:</strong> {selectedPlan.max_ads}</p>
                                                <p><strong>Solde portefeuille max:</strong> {formatPrice(selectedPlan.max_wallet_balance)}</p>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
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
                                    onClick={() => updateUserSubscription(editingSubscription.userId, editingSubscription.newPlanId)}
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