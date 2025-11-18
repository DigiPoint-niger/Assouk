// Fichier : src/app/dashboard/admin/orders/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import {
    FaSearch,
    FaFilter,
    FaEye,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaBoxOpen,
    FaCheckCircle,
    FaTruck,
    FaTimesCircle,
    FaMoneyBillWave,
    FaExclamationTriangle
} from 'react-icons/fa';

export default function OrdersManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();

    // Statuts des commandes
    const orderStatuses = [
        { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'confirmed', label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
        { value: 'delivering', label: 'En livraison', color: 'bg-purple-100 text-purple-800' },
        { value: 'delivered', label: 'Livrée', color: 'bg-green-100 text-green-800' },
        { value: 'canceled', label: 'Annulée', color: 'bg-red-100 text-red-800' }
    ];

    // Méthodes de paiement
    const paymentMethods = {
        'cash_on_delivery': 'Paiement à la livraison',
        'transfer_amana': 'Transfert Amana',
        'transfer_nita': 'Transfert Nita',
        'paypal': 'PayPal'
    };

    // Charger les commandes
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
                    payments(*)
                `)
                .eq('seller_id',user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des commandes:', error);
        } finally {
            setLoading(false);
        }
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
        
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });


    // Afficher les détails d'une commande
    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    // Obtenir l'icône du statut
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <FaExclamationTriangle className="text-yellow-500" />;
            case 'confirmed': return <FaCheckCircle className="text-blue-500" />;
            case 'delivering': return <FaTruck className="text-purple-500" />;
            case 'delivered': return <FaCheckCircle className="text-green-500" />;
            case 'canceled': return <FaTimesCircle className="text-red-500" />;
            default: return <FaBoxOpen />;
        }
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
                <span className="text-lg">Chargement des commandes...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Commandes</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} trouvée{filteredOrders.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    {/* Barre de recherche et filtres */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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
                        
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            <option value="all">Tous les statuts</option>
                            {orderStatuses.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
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
                                    Vendeur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Montant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            #{order.id.slice(-8)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{order.seller?.name}</div>
                                        <div className="text-sm text-gray-500">{order.seller?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {formatPrice(order.total)}
                                        </div>
                                        <div className="text-sm text-gray-500 capitalize">
                                            {paymentMethods[order.payment_method] || order.payment_method}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(order.status)}
                                            <select
                                                disabled
                                                value={order.status}
                                                className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${
                                                    orderStatuses.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {orderStatuses.map(status => (
                                                    <option key={status.value} value={status.value}>
                                                        {status.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => viewOrderDetails(order)}
                                                className="text-[var(--company-blue)] hover:text-[var(--app-dark-blue)] transition-colors"
                                                title="Voir les détails"
                                            >
                                                <FaEye className="text-lg" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12">
                        <FaBoxOpen className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm || statusFilter !== 'all' 
                                ? "Aucune commande ne correspond aux critères de recherche."
                                : "Aucune commande n'a été passée pour le moment."
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de détails de commande */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Détails de la commande #{selectedOrder.id.slice(-8)}
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
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations Client</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedOrder.client?.name}</p>
                                        <p><strong>Téléphone:</strong> {selectedOrder.client?.phone}</p>
                                        <p><strong>Adresse:</strong> {selectedOrder.delivery_address}</p>
                                        <p><strong>Téléphone livraison:</strong> {selectedOrder.delivery_phone}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations Vendeur</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedOrder.seller?.name}</p>
                                        <p><strong>Téléphone:</strong> {selectedOrder.seller?.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Informations de livraison */}
                            {selectedOrder.deliverer && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations Livreur</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedOrder.deliverer?.name}</p>
                                        <p><strong>Téléphone:</strong> {selectedOrder.deliverer?.phone}</p>
                                    </div>
                                </div>
                            )}

                            {/* Informations de paiement */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Informations de Paiement</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Méthode:</strong> {paymentMethods[selectedOrder.payment_method] || selectedOrder.payment_method}</p>
                                    <p><strong>Statut:</strong> 
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                            selectedOrder.payment_status === 'completed' 
                                                ? 'bg-green-100 text-green-800'
                                                : selectedOrder.payment_status === 'failed'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {selectedOrder.payment_status === 'completed' ? 'Complété' :
                                             selectedOrder.payment_status === 'failed' ? 'Échoué' : 'En attente'}
                                        </span>
                                    </p>
                                    <p><strong>Montant total:</strong> {formatPrice(selectedOrder.total)}</p>
                                </div>
                            </div>

                            {/* Historique des paiements */}
                            {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Historique des Paiements</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.payments.map((payment) => (
                                            <div key={payment.id} className="border border-gray-200 rounded-lg p-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{paymentMethods[payment.method] || payment.method}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        payment.status === 'completed' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : payment.status === 'failed'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {payment.status === 'completed' ? 'Complété' :
                                                         payment.status === 'failed' ? 'Échoué' : 'En attente'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Montant: {formatPrice(payment.amount)} • 
                                                    Date: {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                                                    {payment.transaction_code && ` • Code: ${payment.transaction_code}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
        </div>
    );
}