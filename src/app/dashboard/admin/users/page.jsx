// Fichier : src/app/dashboard/admin/users/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSearch,
    FaFilter,
    FaEye,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaUser,
    FaCheckCircle,
    FaTimesCircle,
    FaStore,
    FaTruck,
    FaUserShield,
    FaCrown,
    FaBan,
    FaCheck,
    FaExclamationTriangle,
    FaCreditCard
} from 'react-icons/fa';

export default function UsersManagement() {
    const [users, setUsers] = useState([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [badgeFilter, setBadgeFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [assigningPlan, setAssigningPlan] = useState(false);

    // Rôles des utilisateurs
    const userRoles = [
        { value: 'client', label: 'Client', icon: FaUser, color: 'bg-blue-100 text-blue-800' },
        { value: 'seller', label: 'Vendeur', icon: FaStore, color: 'bg-green-100 text-green-800' },
        { value: 'deliverer', label: 'Livreur', icon: FaTruck, color: 'bg-purple-100 text-purple-800' },
        { value: 'admin', label: 'Administrateur', icon: FaUserShield, color: 'bg-red-100 text-red-800' }
    ];

    // Badges disponibles
    const userBadges = [
        { value: 'none', label: 'Aucun', color: 'bg-gray-100 text-gray-800' },
        { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'verified', label: 'Vérifié', color: 'bg-green-100 text-green-800' }
    ];

    // Charger les utilisateurs et les plans d'abonnement
    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Charger les plans d'abonnement
            const { data: plansData, error: plansError } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price', { ascending: true });

            if (plansError) throw plansError;
            setSubscriptionPlans(plansData || []);

            // Charger les utilisateurs avec leurs plans
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    subscription_plans (*)
                `)
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Récupérer les statistiques pour chaque utilisateur
            const usersWithStats = await Promise.all(
                (usersData || []).map(async (user) => {
                    let stats = {};

                    if (user.role === 'seller') {
                        // Statistiques vendeur
                        const { data: products } = await supabase
                            .from('products')
                            .select('id')
                            .eq('seller_id', user.id);

                        const { data: orders } = await supabase
                            .from('orders')
                            .select('id, total')
                            .eq('seller_id', user.id)
                            .eq('status', 'delivered');

                        stats.productsCount = products?.length || 0;
                        stats.ordersCount = orders?.length || 0;
                        stats.totalSales = orders?.reduce((sum, order) => sum + order.total, 0) || 0;

                    } else if (user.role === 'deliverer') {
                        // Statistiques livreur
                        const { data: deliveries } = await supabase
                            .from('orders')
                            .select('id')
                            .eq('deliverer_id', user.id)
                            .eq('status', 'delivered');

                        stats.deliveriesCount = deliveries?.length || 0;
                    }

                    // Statistiques communes
                    const { data: orders } = await supabase
                        .from('orders')
                        .select('id')
                        .or(`client_id.eq.${user.id},seller_id.eq.${user.id},deliverer_id.eq.${user.id}`);

                    stats.totalOrders = orders?.length || 0;

                    return { ...user, stats };
                })
            );

            setUsers(usersWithStats);
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filtrer les utilisateurs
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesBadge = badgeFilter === 'all' || user.badge === badgeFilter;
        
        return matchesSearch && matchesRole && matchesBadge;
    });

    // Mettre à jour le rôle d'un utilisateur
    const updateUserRole = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (error) {
            console.error('Erreur lors de la mise à jour du rôle:', error);
        }
    };

    // Mettre à jour le badge d'un utilisateur
    const updateUserBadge = async (userId, newBadge) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ badge: newBadge, is_verified: newBadge === 'verified' })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(user => 
                user.id === userId ? { ...user, badge: newBadge, is_verified: newBadge === 'verified' } : user
            ));
        } catch (error) {
            console.error('Erreur lors de la mise à jour du badge:', error);
        }
    };

    // Assigner un plan d'abonnement
    const assignSubscriptionPlan = async (userId, planId) => {
        setAssigningPlan(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_plan: planId || null })
                .eq('id', userId);

            if (error) throw error;

            // Mettre à jour l'utilisateur avec les détails du plan
            const updatedPlan = subscriptionPlans.find(plan => plan.id === planId) || null;
            
            setUsers(users.map(user => 
                user.id === userId ? { 
                    ...user, 
                    subscription_plan: planId,
                    subscription_plans: updatedPlan
                } : user
            ));

            // Fermer le modal si ouvert
            if (isSubscriptionModalOpen) {
                setIsSubscriptionModalOpen(false);
            }
        } catch (error) {
            console.error('Erreur lors de l\'assignation du plan:', error);
            alert('Erreur lors de l\'assignation du plan d\'abonnement');
        } finally {
            setAssigningPlan(false);
        }
    };

    // Retirer un plan d'abonnement
    const removeSubscriptionPlan = async (userId) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_plan: null })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(user => 
                user.id === userId ? { 
                    ...user, 
                    subscription_plan: null,
                    subscription_plans: null
                } : user
            ));
        } catch (error) {
            console.error('Erreur lors de la suppression du plan:', error);
        }
    };

    // Suspendre un utilisateur
    const suspendUser = async (userId, currentStatus) => {
        try {
            const newBadge = currentStatus === 'none' ? 'pending' : 'none';
            
            const { error } = await supabase
                .from('profiles')
                .update({ badge: newBadge })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(user => 
                user.id === userId ? { ...user, badge: newBadge } : user
            ));
        } catch (error) {
            console.error('Erreur lors de la suspension:', error);
        }
    };

    // Supprimer un utilisateur
    const deleteUser = async (userId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.filter(user => user.id !== userId));
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    // Afficher les détails d'un utilisateur
    const viewUserDetails = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    // Ouvrir le modal d'assignation de plan
    const openSubscriptionModal = (user) => {
        setSelectedUser(user);
        setIsSubscriptionModalOpen(true);
    };

    // Obtenir l'icône du rôle
    const getRoleIcon = (role) => {
        const roleInfo = userRoles.find(r => r.value === role);
        return roleInfo ? roleInfo.icon : FaUser;
    };

    // Obtenir les informations du rôle
    const getRoleInfo = (role) => {
        return userRoles.find(r => r.value === role) || userRoles[0];
    };

    // Obtenir les informations du badge
    const getBadgeInfo = (badge) => {
        return userBadges.find(b => b.value === badge) || userBadges[0];
    };

    // Formater le prix
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(price);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des utilisateurs...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
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
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            <option value="all">Tous les rôles</option>
                            {userRoles.map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={badgeFilter}
                            onChange={(e) => setBadgeFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            <option value="all">Tous les badges</option>
                            {userBadges.map(badge => (
                                <option key={badge.value} value={badge.value}>
                                    {badge.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tableau des utilisateurs */}
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
                                    Badge
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plan d'abonnement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statistiques
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Inscription
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => {
                                const RoleIcon = getRoleIcon(user.role);
                                const roleInfo = getRoleInfo(user.role);
                                const badgeInfo = getBadgeInfo(user.badge);
                                const hasSubscription = user.subscription_plan && user.subscription_plans;
                                
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.phone || 'Non renseigné'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <RoleIcon className={roleInfo.color.replace('bg-', 'text-').split(' ')[0]} />
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${roleInfo.color}`}
                                                >
                                                    {userRoles.map(role => (
                                                        <option key={role.value} value={role.value}>
                                                            {role.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {user.badge === 'verified' && <FaCheckCircle className="text-green-500" />}
                                                {user.badge === 'pending' && <FaExclamationTriangle className="text-yellow-500" />}
                                                {user.badge === 'none' && <FaUser className="text-gray-400" />}
                                                <select
                                                    value={user.badge}
                                                    onChange={(e) => updateUserBadge(user.id, e.target.value)}
                                                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${badgeInfo.color}`}
                                                >
                                                    {userBadges.map(badge => (
                                                        <option key={badge.value} value={badge.value}>
                                                            {badge.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {hasSubscription ? (
                                                    <>
                                                        <FaCrown className="text-yellow-500" />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {user.subscription_plans.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            ({formatPrice(user.subscription_plans.price)})
                                                        </span>
                                                        <button
                                                            onClick={() => removeSubscriptionPlan(user.id)}
                                                            className="text-red-600 hover:text-red-800 transition-colors ml-2"
                                                            title="Retirer le plan"
                                                        >
                                                            <FaTimesCircle className="text-sm" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-sm text-gray-500">Aucun plan</span>
                                                        {(user.role === 'seller' || user.role === 'deliverer') && (
                                                            <button
                                                                onClick={() => openSubscriptionModal(user)}
                                                                className="text-[var(--company-blue)] hover:text-[var(--app-dark-blue)] transition-colors ml-2"
                                                                title="Assigner un plan"
                                                            >
                                                                <FaCreditCard className="text-sm" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-600 space-y-1">
                                                {user.role === 'seller' && (
                                                    <>
                                                        <div>📦 {user.stats?.productsCount || 0} produits</div>
                                                        <div>💰 {user.stats?.ordersCount || 0} ventes</div>
                                                        <div>🎯 {formatPrice(user.stats?.totalSales || 0)} CA</div>
                                                    </>
                                                )}
                                                {user.role === 'deliverer' && (
                                                    <div>🚚 {user.stats?.deliveriesCount || 0} livraisons</div>
                                                )}
                                                {user.role === 'client' && (
                                                    <div>🛒 {user.stats?.totalOrders || 0} commandes</div>
                                                )}
                                                {user.role === 'admin' && (
                                                    <div>⚙️ Administrateur</div>
                                                )}
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
                                                
                                                {(user.role === 'seller' || user.role === 'deliverer') && (
                                                    <button
                                                        onClick={() => openSubscriptionModal(user)}
                                                        className="text-yellow-600 hover:text-yellow-800 transition-colors"
                                                        title="Gérer l'abonnement"
                                                    >
                                                        <FaCreditCard className="text-lg" />
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={() => suspendUser(user.id, user.badge)}
                                                    className={`${
                                                        user.badge === 'none' 
                                                            ? 'text-green-600 hover:text-green-800' 
                                                            : 'text-yellow-600 hover:text-yellow-800'
                                                    } transition-colors`}
                                                    title={user.badge === 'none' ? 'Réactiver' : 'Suspendre'}
                                                >
                                                    {user.badge === 'none' ? <FaCheck className="text-lg" /> : <FaBan className="text-lg" />}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                    title="Supprimer l'utilisateur"
                                                    disabled={user.role === 'admin'}
                                                >
                                                    <FaTrash className={`text-lg ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                                </button>
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
                        <FaUser className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm || roleFilter !== 'all' || badgeFilter !== 'all'
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
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Détails de l'utilisateur
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
                            {/* Informations générales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations personnelles</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedUser.name}</p>
                                        <p><strong>ID:</strong> {selectedUser.id}</p>
                                        <p><strong>Téléphone:</strong> {selectedUser.phone || 'Non renseigné'}</p>
                                        <p><strong>Email:</strong> {selectedUser.email || 'Non disponible'}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Statut et rôle</h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <strong>Rôle:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getRoleInfo(selectedUser.role).color}`}>
                                                {getRoleInfo(selectedUser.role).label}
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Badge:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getBadgeInfo(selectedUser.badge).color}`}>
                                                {getBadgeInfo(selectedUser.badge).label}
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Vérifié:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                selectedUser.is_verified 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {selectedUser.is_verified ? 'Oui' : 'Non'}
                                            </span>
                                        </p>
                                        <p><strong>Note moyenne:</strong> {selectedUser.avg_rating || '0.0'}/5</p>
                                    </div>
                                </div>
                            </div>

                            {/* Plan d'abonnement */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Plan d'abonnement</h3>
                                {selectedUser.subscription_plans ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <FaCrown className="text-yellow-500" />
                                                    <span className="font-semibold text-yellow-800">
                                                        {selectedUser.subscription_plans.name}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-yellow-700 mt-1">
                                                    <p>Prix: {formatPrice(selectedUser.subscription_plans.price)}</p>
                                                    <p>Produits max: {selectedUser.subscription_plans.max_products}</p>
                                                    <p>Annonces max: {selectedUser.subscription_plans.max_ads}</p>
                                                    <p>Solde wallet max: {formatPrice(selectedUser.subscription_plans.max_wallet_balance)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeSubscriptionPlan(selectedUser.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Retirer le plan"
                                            >
                                                <FaTimesCircle className="text-xl" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                        <p className="text-gray-600">Aucun plan d'abonnement assigné</p>
                                        {(selectedUser.role === 'seller' || selectedUser.role === 'deliverer') && (
                                            <button
                                                onClick={() => {
                                                    setIsModalOpen(false);
                                                    openSubscriptionModal(selectedUser);
                                                }}
                                                className="mt-2 px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                            >
                                                Assigner un plan
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Statistiques détaillées */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Statistiques</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {selectedUser.role === 'seller' && (
                                        <>
                                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                                <div className="text-2xl font-bold text-blue-600">{selectedUser.stats?.productsCount || 0}</div>
                                                <div className="text-sm text-blue-800">Produits</div>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                                <div className="text-2xl font-bold text-green-600">{selectedUser.stats?.ordersCount || 0}</div>
                                                <div className="text-sm text-green-800">Ventes</div>
                                            </div>
                                            <div className="bg-purple-50 p-4 rounded-lg text-center">
                                                <div className="text-2xl font-bold text-purple-600">{formatPrice(selectedUser.stats?.totalSales || 0)}</div>
                                                <div className="text-sm text-purple-800">Chiffre d'affaires</div>
                                            </div>
                                        </>
                                    )}
                                    {selectedUser.role === 'deliverer' && (
                                        <div className="bg-orange-50 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-orange-600">{selectedUser.stats?.deliveriesCount || 0}</div>
                                            <div className="text-sm text-orange-800">Livraisons</div>
                                        </div>
                                    )}
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-600">{selectedUser.stats?.totalOrders || 0}</div>
                                        <div className="text-sm text-gray-800">Commandes totales</div>
                                    </div>
                                </div>
                            </div>

                            {/* Métadonnées */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Métadonnées</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Date d'inscription:</strong> {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                                    <p><strong>Dernière connexion:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
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

            {/* Modal d'assignation de plan d'abonnement */}
            {isSubscriptionModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Assigner un plan d'abonnement
                                </h2>
                                <button
                                    onClick={() => setIsSubscriptionModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={assigningPlan}
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                            <p className="text-gray-600 mt-1">
                                Pour {selectedUser.name} ({getRoleInfo(selectedUser.role).label})
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {subscriptionPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-[var(--company-blue)] transition-colors cursor-pointer"
                                        onClick={() => !assigningPlan && assignSubscriptionPlan(selectedUser.id, plan.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{plan.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {formatPrice(plan.price)} / mois
                                                </p>
                                                <div className="text-xs text-gray-500 mt-2 space-y-1">
                                                    <p>• {plan.max_products} produits maximum</p>
                                                    <p>• {plan.max_ads} annonces maximum</p>
                                                    <p>• Solde wallet: {formatPrice(plan.max_wallet_balance)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedUser.subscription_plan === plan.id && (
                                                    <FaCheckCircle className="text-green-500" />
                                                )}
                                                <button
                                                    onClick={() => assignSubscriptionPlan(selectedUser.id, plan.id)}
                                                    disabled={assigningPlan || selectedUser.subscription_plan === plan.id}
                                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                                        selectedUser.subscription_plan === plan.id
                                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                            : 'bg-[var(--company-blue)] text-white hover:bg-[var(--app-dark-blue)]'
                                                    }`}
                                                >
                                                    {assigningPlan ? (
                                                        <FaSpinner className="animate-spin" />
                                                    ) : selectedUser.subscription_plan === plan.id ? (
                                                        'Assigné'
                                                    ) : (
                                                        'Assigner'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Option pour retirer le plan */}
                                {selectedUser.subscription_plan && (
                                    <div className="border border-red-200 rounded-lg p-4 mt-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-red-800">Retirer le plan actuel</h3>
                                                <p className="text-sm text-red-600 mt-1">
                                                    Cet utilisateur reviendra au plan gratuit
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeSubscriptionPlan(selectedUser.id)}
                                                disabled={assigningPlan}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                {assigningPlan ? <FaSpinner className="animate-spin" /> : 'Retirer'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsSubscriptionModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    disabled={assigningPlan}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}