// Fichier : src/app/dashboard/deliverer/history/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useCurrency } from '@/context/CurrencyContext';
import { 
    FaTruck, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaSpinner,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaMoneyBillWave
} from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';

export default function DeliveryHistoryPage() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, delivered, canceled

    useEffect(() => {
        fetchDeliveryHistory();
    }, [user, filter]);

    const fetchDeliveryHistory = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('orders')
                .select(`
                    *,
                    client:profiles!orders_client_id_fkey(name, phone),
                    seller:profiles!orders_seller_id_fkey(name)
                `)
                .eq('deliverer_id', user.id);

            // Appliquer le filtre
            if (filter === 'delivered') {
                query = query.eq('status', 'delivered');
            } else if (filter === 'canceled') {
                query = query.eq('status', 'canceled');
            } else {
                query = query.in('status', ['delivered', 'canceled']);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false });

            if (error) throw error;

            setDeliveries(data || []);
        } catch (err) {
            console.error("Erreur de chargement de l'historique:", err);
            setError("Impossible de charger l'historique des livraisons.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'delivered':
                return <FaCheckCircle className="text-green-500" />;
            case 'canceled':
                return <FaTimesCircle className="text-red-500" />;
            default:
                return <FaSpinner className="text-blue-500" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'delivered':
                return 'Livrée';
            case 'canceled':
                return 'Annulée';
            default:
                return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'canceled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)]" />
                <span className="ml-3 text-lg text-gray-700">Chargement de l'historique...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center shadow-lg">
                <FaCircleXmark className="text-2xl mr-3" />
                <span className='font-semibold'>Erreur : {error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Historique des Livraisons</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            filter === 'all' 
                            ? 'bg-[var(--app-dark-blue)] text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Toutes
                    </button>
                    <button
                        onClick={() => setFilter('delivered')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            filter === 'delivered' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Livrées
                    </button>
                    <button
                        onClick={() => setFilter('canceled')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            filter === 'canceled' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Annulées
                    </button>
                </div>
            </div>

            {deliveries.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                    <FaTruck className="text-6xl text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune livraison dans l'historique</h3>
                    <p className="text-gray-500">Vos livraisons terminées apparaîtront ici.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveries.map((delivery) => (
                        <div key={delivery.id} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-l-[var(--app-orange)]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        Commande #{delivery.id.slice(-8)}
                                    </h3>
                                    <p className="text-gray-600">Client: {delivery.client?.name || 'N/A'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(delivery.status)}
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(delivery.status)}`}>
                                        {getStatusText(delivery.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <FaCalendarAlt className="text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {new Date(delivery.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-gray-400" />
                                    <span className="text-sm text-gray-600">{delivery.delivery_address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaMoneyBillWave className="text-gray-400" />
                                    <span className="text-sm font-semibold text-[var(--app-orange)]">
                                        {formatPrice(delivery.total, delivery.currency)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaTruck className="text-gray-400" />
                                    <span className="text-sm font-semibold text-green-600">
                                        {formatPrice(delivery.delivery_fee, delivery.currency)}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Vendeur: {delivery.seller?.name || 'N/A'}</span>
                                    <span>Téléphone: {delivery.delivery_phone}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}