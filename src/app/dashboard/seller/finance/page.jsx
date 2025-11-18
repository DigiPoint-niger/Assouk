// Fichier : src/app/dashboard/admin/payments/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import {
    FaSearch,
    FaSpinner,
    FaMoneyBillWave,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaEye,
    FaExchangeAlt,
    FaFilter,
    FaCalendarAlt,
    FaReceipt,
    FaUser} from 'react-icons/fa';

export default function PaymentsManagement() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedMethod, setSelectedMethod] = useState('all');
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        totalAmount: 0,
        cash_on_delivery: 0,
        transfer_amana: 0,
        transfer_nita: 0,
        paypal: 0
    });

    // Charger les paiements avec les informations des relations
    const fetchPayments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    user:profiles!user_id(name, phone),
                    order:orders(id, total, status),
                    currency:currencies(code, symbol)
                `)
                .eq('user_id',user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPayments(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des paiements:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculer les statistiques
    const calculateStats = (paymentsData) => {
        const stats = {
            total: paymentsData.length,
            pending: 0,
            completed: 0,
            failed: 0,
            totalAmount: 0,
            cash_on_delivery: 0,
            transfer_amana: 0,
            transfer_nita: 0,
            paypal: 0
        };

        paymentsData.forEach(payment => {
            // Compter par statut
            stats[payment.status] = (stats[payment.status] || 0) + 1;
            
            // Compter par méthode
            if (payment.method) {
                stats[payment.method] = (stats[payment.method] || 0) + 1;
            }
            
            // Calculer le montant total (seulement les paiements complétés)
            if (payment.status === 'completed') {
                stats.totalAmount += payment.amount;
            }
        });

        setStats(stats);
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // Filtrer les paiements
    const filteredPayments = payments.filter(payment => {
        const matchesSearch = 
            payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.transaction_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.transaction_phone?.includes(searchTerm);

        const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
        const matchesMethod = selectedMethod === 'all' || payment.method === selectedMethod;

        return matchesSearch && matchesStatus && matchesMethod;
    });

    // Mettre à jour le statut d'un paiement
    const updatePaymentStatus = async (paymentId, newStatus) => {
        try {
            const { error } = await supabase
                .from('payments')
                .update({ status: newStatus })
                .eq('id', paymentId);

            if (error) throw error;

            // Mettre à jour l'état local
            setPayments(payments.map(payment => 
                payment.id === paymentId ? { ...payment, status: newStatus } : payment
            ));

            // Recalculer les stats
            calculateStats(payments.map(payment => 
                payment.id === paymentId ? { ...payment, status: newStatus } : payment
            ));

            // Si le statut est complété, mettre à jour aussi le statut de paiement de la commande
            if (newStatus === 'completed') {
                const payment = payments.find(p => p.id === paymentId);
                if (payment && payment.order_id) {
                    await supabase
                        .from('orders')
                        .update({ payment_status: 'completed' })
                        .eq('id', payment.order_id);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            alert('Erreur lors de la mise à jour du statut');
        }
    };

    // Obtenir la couleur du statut
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Obtenir la couleur de la méthode de paiement
    const getMethodColor = (method) => {
        switch (method) {
            case 'cash_on_delivery': return 'bg-blue-100 text-blue-800';
            case 'transfer_amana': return 'bg-purple-100 text-purple-800';
            case 'transfer_nita': return 'bg-indigo-100 text-indigo-800';
            case 'paypal': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Formater le nom de la méthode de paiement
    const formatMethodName = (method) => {
        switch (method) {
            case 'cash_on_delivery': return 'Paiement à la livraison';
            case 'transfer_amana': return 'Transfert Amana';
            case 'transfer_nita': return 'Transfert Nita';
            case 'paypal': return 'PayPal';
            default: return method;
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

    // Afficher les détails d'un paiement
    const showPaymentDetails = (payment) => {
        setPaymentDetails(payment);
        setIsDetailsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des paiements...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Paiements</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredPayments.length} paiement{filteredPayments.length !== 1 ? 's' : ''} trouvé{filteredPayments.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Barre de recherche */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un paiement..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Cartes de statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                            </div>
                            <FaMoneyBillWave className="text-blue-500 text-xl" />
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
                    
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Complétés</p>
                                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                            </div>
                            <FaCheckCircle className="text-green-500 text-xl" />
                        </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 font-medium">Échoués</p>
                                <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
                            </div>
                            <FaTimesCircle className="text-red-500 text-xl" />
                        </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Montant Total</p>
                                <p className="text-lg font-bold text-green-700">
                                    {formatPrice(stats.totalAmount, { code: 'XOF' })}
                                </p>
                            </div>
                            <FaExchangeAlt className="text-green-500 text-xl" />
                        </div>
                    </div>
                </div>

                {/* Statistiques des méthodes de paiement */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                        <p className="text-xs text-blue-600 font-medium">Paiement Livraison</p>
                        <p className="text-lg font-bold text-blue-700">{stats.cash_on_delivery}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                        <p className="text-xs text-purple-600 font-medium">Transfert Amana</p>
                        <p className="text-lg font-bold text-purple-700">{stats.transfer_amana}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 border-l-4 border-indigo-500">
                        <p className="text-xs text-indigo-600 font-medium">Transfert Nita</p>
                        <p className="text-lg font-bold text-indigo-700">{stats.transfer_nita}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-300">
                        <p className="text-xs text-blue-600 font-medium">PayPal</p>
                        <p className="text-lg font-bold text-blue-700">{stats.paypal}</p>
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
                        <option value="completed">Complété</option>
                        <option value="failed">Échoué</option>
                    </select>

                    <select
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                    >
                        <option value="all">Toutes les méthodes</option>
                        <option value="cash_on_delivery">Paiement à la livraison</option>
                        <option value="transfer_amana">Transfert Amana</option>
                        <option value="transfer_nita">Transfert Nita</option>
                        <option value="paypal">PayPal</option>
                    </select>
                </div>
            </div>

            {/* Tableau des paiements */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Paiement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Montant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Méthode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transaction
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
                            {filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                <FaReceipt className="text-2xl text-[var(--company-blue)]" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    Paiement #{payment.id.slice(-8)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Commande: {payment.order_id ? `#${payment.order_id.slice(-8)}` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                <FaUser className="text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {payment.user?.name || 'N/A'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {payment.user?.phone || 'Sans téléphone'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            {formatPrice(payment.amount, payment.currency)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(payment.method)}`}>
                                            {formatMethodName(payment.method)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={payment.status}
                                            onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
                                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${getStatusColor(payment.status)}`}
                                        >
                                            <option value="pending">En attente</option>
                                            <option value="completed">Complété</option>
                                            <option value="failed">Échoué</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {payment.transaction_code ? (
                                                <div>
                                                    <div className="font-medium">Code: {payment.transaction_code}</div>
                                                    {payment.transaction_phone && (
                                                        <div className="text-gray-500">Tél: {payment.transaction_phone}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Aucun détail</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <FaCalendarAlt className="text-gray-400" />
                                            {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => showPaymentDetails(payment)}
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

                {filteredPayments.length === 0 && (
                    <div className="text-center py-12">
                        <FaMoneyBillWave className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm || selectedStatus !== 'all' || selectedMethod !== 'all'
                                ? "Aucun paiement ne correspond aux critères de recherche."
                                : "Aucun paiement n'a été trouvé pour le moment."
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de détails de paiement */}
            {isDetailsModalOpen && paymentDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Détails du Paiement #{paymentDetails.id.slice(-8)}
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
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations Utilisateur</h3>
                                    <div className="space-y-2">
                                        <p><strong>Nom:</strong> {paymentDetails.user?.name || 'N/A'}</p>
                                        <p><strong>Téléphone:</strong> {paymentDetails.user?.phone || 'N/A'}</p>
                                        <p><strong>Commande associée:</strong> {paymentDetails.order_id ? `#${paymentDetails.order_id.slice(-8)}` : 'Aucune'}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations Paiement</h3>
                                    <div className="space-y-2">
                                        <p><strong>Méthode:</strong> {formatMethodName(paymentDetails.method)}</p>
                                        <p><strong>Devise:</strong> {paymentDetails.currency?.code || 'XOF'}</p>
                                        <p><strong>Montant:</strong> {formatPrice(paymentDetails.amount, paymentDetails.currency)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Détails de transaction */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Détails de Transaction</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    {paymentDetails.transaction_code || paymentDetails.transaction_phone ? (
                                        <div className="space-y-2">
                                            {paymentDetails.transaction_code && (
                                                <p><strong>Code de transaction:</strong> {paymentDetails.transaction_code}</p>
                                            )}
                                            {paymentDetails.transaction_phone && (
                                                <p><strong>Téléphone de transaction:</strong> {paymentDetails.transaction_phone}</p>
                                            )}
                                            {paymentDetails.description && (
                                                <p><strong>Description:</strong> {paymentDetails.description}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Aucun détail de transaction disponible</p>
                                    )}
                                </div>
                            </div>

                            {/* Statuts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Statut du paiement
                                    </label>
                                    <select
                                        value={paymentDetails.status}
                                        onChange={(e) => {
                                            updatePaymentStatus(paymentDetails.id, e.target.value);
                                            setPaymentDetails({...paymentDetails, status: e.target.value});
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-[var(--company-blue)] ${getStatusColor(paymentDetails.status)}`}
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="completed">Complété</option>
                                        <option value="failed">Échoué</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Méthode de paiement
                                    </label>
                                    <div className={`w-full px-3 py-2 rounded-lg ${getMethodColor(paymentDetails.method)}`}>
                                        {formatMethodName(paymentDetails.method)}
                                    </div>
                                </div>
                            </div>

                            {/* Date de création */}
                            <div className="text-sm text-gray-500">
                                <p><strong>Date de création:</strong> {new Date(paymentDetails.created_at).toLocaleString('fr-FR')}</p>
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