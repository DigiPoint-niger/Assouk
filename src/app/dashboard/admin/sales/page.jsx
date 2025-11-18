// Fichier : src/app/dashboard/admin/sales/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSearch,
    FaSpinner,
    FaShoppingCart,
    FaMoneyBillWave,
    FaTruck,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaExclamationTriangle,
    FaEye,
    FaChartLine,
    FaFilter,
    FaCalendarAlt
} from 'react-icons/fa';

export default function SalesManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
    const [orderDetails, setOrderDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        delivering: 0,
        delivered: 0,
        canceled: 0,
        totalRevenue: 0
    });

    // Charger les commandes avec les informations des utilisateurs
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    client:profiles!client_id(name, phone),
                    seller:profiles!seller_id(name, phone),
                    deliverer:profiles!deliverer_id(name, phone),
                    currency:currencies(code, symbol)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setOrders(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des commandes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculer les statistiques
    const calculateStats = (ordersData) => {
        const stats = {
            total: ordersData.length,
            pending: 0,
            confirmed: 0,
            delivering: 0,
            delivered: 0,
            canceled: 0,
            totalRevenue: 0
        };

        ordersData.forEach(order => {
            // Compter par statut
            stats[order.status] = (stats[order.status] || 0) + 1;
            
            // Calculer le revenu total (seulement les commandes livrées et payées)
            if (order.status === 'delivered' && order.payment_status === 'completed') {
                stats.totalRevenue += order.total;
            }
        });

        setStats(stats);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Filtrer les commandes
    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.payment_status === selectedPaymentStatus;

        return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

    // Mettre à jour le statut d'une commande
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Mettre à jour l'état local
            setOrders(orders.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            // Recalculer les stats
            calculateStats(orders.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            alert('Erreur lors de la mise à jour du statut');
        }
    };

    // Mettre à jour le statut de paiement
    const updatePaymentStatus = async (orderId, newPaymentStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_status: newPaymentStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Mettre à jour l'état local
            setOrders(orders.map(order => 
                order.id === orderId ? { ...order, payment_status: newPaymentStatus } : order
            ));

            // Recalculer les stats si nécessaire
            calculateStats(orders.map(order => 
                order.id === orderId ? { ...order, payment_status: newPaymentStatus } : order
            ));
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut de paiement:', error);
            alert('Erreur lors de la mise à jour du statut de paiement');
        }
    };

    // Obtenir la couleur du statut
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'delivering': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'canceled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Obtenir la couleur du statut de paiement
    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Obtenir l'icône du statut
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <FaClock className="text-yellow-500" />;
            case 'confirmed': return <FaCheckCircle className="text-blue-500" />;
            case 'delivering': return <FaTruck className="text-purple-500" />;
            case 'delivered': return <FaCheckCircle className="text-green-500" />;
            case 'canceled': return <FaTimesCircle className="text-red-500" />;
            default: return <FaExclamationTriangle className="text-gray-500" />;
        }
    };

    // Formater le prix
    const formatPrice = (amount, currency) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency?.code || 'XOF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Afficher les détails d'une commande
    const showOrderDetails = (order) => {
        setOrderDetails(order);
        setIsDetailsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des ventes...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Ventes</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} trouvée{filteredOrders.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Barre de recherche */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une commande..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Cartes de statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                            </div>
                            <FaShoppingCart className="text-blue-500 text-xl" />
                        </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-600 font-medium">En Attente</p>
                                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                            </div>
                            <FaClock className="text-yellow-500 text-xl" />
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Confirmées</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.confirmed}</p>
                            </div>
                            <FaCheckCircle className="text-blue-500 text-xl" />
                        </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 font-medium">En Livraison</p>
                                <p className="text-2xl font-bold text-purple-700">{stats.delivering}</p>
                            </div>
                            <FaTruck className="text-purple-500 text-xl" />
                        </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Livrées</p>
                                <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
                            </div>
                            <FaCheckCircle className="text-green-500 text-xl" />
                        </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 font-medium">Annulées</p>
                                <p className="text-2xl font-bold text-red-700">{stats.canceled}</p>
                            </div>
                            <FaTimesCircle className="text-red-500 text-xl" />
                        </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Revenu Total</p>
                                <p className="text-lg font-bold text-green-700">
                                    {formatPrice(stats.totalRevenue, { code: 'XOF' })}
                                </p>
                            </div>
                            <FaMoneyBillWave className="text-green-500 text-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Filtrer par:</span>
                    </div>
                    
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="delivering">En livraison</option>
                        <option value="delivered">Livrée</option>
                        <option value="canceled">Annulée</option>
                    </select>

                    <select
                        value={selectedPaymentStatus}
                        onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                    >
                        <option value="all">Tous les paiements</option>
                        <option value="pending">Paiement en attente</option>
                        <option value="completed">Paiement complété</option>
                        <option value="failed">Paiement échoué</option>
                    </select>
                </div>
            </div>

            {/* Tableau des commandes */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Commande
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Client
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendeur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Montant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Paiement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                <FaShoppingCart className="text-2xl text-[var(--company-blue)]" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    Commande #{order.id.slice(-8)}
                                                </div>
                                                <div className="text-sm text-gray-500 capitalize">
                                                    {order.payment_method?.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.client?.name || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.client?.phone || 'Sans téléphone'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.seller?.name || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.seller?.phone || 'Sans téléphone'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            {formatPrice(order.total, order.currency)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${getStatusColor(order.status)}`}
                                        >
                                            <option value="pending">En attente</option>
                                            <option value="confirmed">Confirmée</option>
                                            <option value="delivering">En livraison</option>
                                            <option value="delivered">Livrée</option>
                                            <option value="canceled">Annulée</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={order.payment_status}
                                            onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${getPaymentStatusColor(order.payment_status)}`}
                                        >
                                            <option value="pending">En attente</option>
                                            <option value="completed">Complété</option>
                                            <option value="failed">Échoué</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <FaCalendarAlt className="text-gray-400" />
                                            {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => showOrderDetails(order)}
                                            className="text-[var(--company-blue)] hover:text-[var(--app-dark-blue)] transition-colors"
                                            title="Voir les détails"
                                        >
                                            <FaEye className="text-lg" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12">
                        <FaShoppingCart className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm || selectedStatus !== 'all' || selectedPaymentStatus !== 'all'
                                ? "Aucune commande ne correspond aux critères de recherche."
                                : "Aucune commande n'a été trouvée pour le moment."
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de détails de commande */}
            {isDetailsModalOpen && orderDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Détails de la Commande #{orderDetails.id.slice(-8)}
                                </h2>
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Informations générales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations Client</h3>
                                    <div className="space-y-2">
                                        <p><strong>Nom:</strong> {orderDetails.client?.name || 'N/A'}</p>
                                        <p><strong>Téléphone:</strong> {orderDetails.client?.phone || 'N/A'}</p>
                                        <p><strong>Adresse de livraison:</strong> {orderDetails.delivery_address || 'Non spécifiée'}</p>
                                        <p><strong>Téléphone livraison:</strong> {orderDetails.delivery_phone || 'Non spécifié'}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations Vente</h3>
                                    <div className="space-y-2">
                                        <p><strong>Vendeur:</strong> {orderDetails.seller?.name || 'N/A'}</p>
                                        <p><strong>Livreur:</strong> {orderDetails.deliverer?.name || 'Non assigné'}</p>
                                        <p><strong>Méthode de paiement:</strong> {orderDetails.payment_method ? orderDetails.payment_method.replace(/_/g, ' ') : 'Non spécifiée'}</p>
                                        <p><strong>Devise:</strong> {orderDetails.currency?.code || 'XOF'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Statuts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Statut de la commande
                                    </label>
                                    <select
                                        value={orderDetails.status}
                                        onChange={(e) => {
                                            updateOrderStatus(orderDetails.id, e.target.value);
                                            setOrderDetails({...orderDetails, status: e.target.value});
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${getStatusColor(orderDetails.status)}`}
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="confirmed">Confirmée</option>
                                        <option value="delivering">En livraison</option>
                                        <option value="delivered">Livrée</option>
                                        <option value="canceled">Annulée</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Statut de paiement
                                    </label>
                                    <select
                                        value={orderDetails.payment_status}
                                        onChange={(e) => {
                                            updatePaymentStatus(orderDetails.id, e.target.value);
                                            setOrderDetails({...orderDetails, payment_status: e.target.value});
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${getPaymentStatusColor(orderDetails.payment_status)}`}
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="completed">Complété</option>
                                        <option value="failed">Échoué</option>
                                    </select>
                                </div>
                            </div>

                            {/* Résumé financier */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Résumé Financier</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-700">Total:</span>
                                    <span className="text-2xl font-bold text-[var(--company-green)]">
                                        {formatPrice(orderDetails.total, orderDetails.currency)}
                                    </span>
                                </div>
                            </div>

                            {/* Date de création */}
                            <div className="text-sm text-gray-500">
                                <p><strong>Date de création:</strong> {new Date(orderDetails.created_at).toLocaleString('fr-FR')}</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}