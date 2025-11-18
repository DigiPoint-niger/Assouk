// Fichier : src/app/dashboard/deliverer/new-orders/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useCurrency } from '@/context/CurrencyContext';
import { 
    FaTruck, 
    FaClock, 
    FaCheckCircle, 
    FaSpinner,
    FaMapMarkerAlt,
    FaPhone,
    FaUser,
    FaShoppingBag
} from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';

export default function NewOrdersPage() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [newOrders, setNewOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [acceptingOrder, setAcceptingOrder] = useState(null);

    useEffect(() => {
        fetchNewOrders();
    }, [user]);

    const fetchNewOrders = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Récupérer les commandes avec statut 'confirmed' qui n'ont pas de livreur assigné
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    client:profiles!orders_client_id_fkey(name, phone),
                    seller:profiles!orders_seller_id_fkey(name),
                    order_items(
                        quantity,
                        unit_price,
                        total_price,
                        product:products(name)
                    )
                `)
                .eq('status', 'confirmed')
                .is('deliverer_id', null)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setNewOrders(data || []);
        } catch (err) {
            console.error("Erreur de chargement des nouvelles commandes:", err);
            setError("Impossible de charger les nouvelles commandes.");
        } finally {
            setLoading(false);
        }
    };

    const acceptOrder = async (orderId) => {
        if (!user) return;

        setAcceptingOrder(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ 
                    deliverer_id: user.id,
                    status: 'delivering'
                })
                .eq('id', orderId);

            if (error) throw error;

            // Recharger la liste des nouvelles commandes
            await fetchNewOrders();
            
        } catch (err) {
            console.error("Erreur lors de l'acceptation de la commande:", err);
            alert("Erreur lors de l'acceptation de la commande. Veuillez réessayer.");
        } finally {
            setAcceptingOrder(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)]" />
                <span className="ml-3 text-lg text-gray-700">Chargement des nouvelles commandes...</span>
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
                <h1 className="text-3xl font-bold text-gray-800">Nouvelles Commandes</h1>
                <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                    <FaClock className="text-xl" />
                    <span className="font-semibold">{newOrders.length} commande(s) disponible(s)</span>
                </div>
            </div>

            {newOrders.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                    <FaCheckCircle className="text-6xl text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune nouvelle commande</h3>
                    <p className="text-gray-500">Toutes les commandes disponibles ont été acceptées.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {newOrders.map((order) => (
                        <div key={order.id} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        Commande #{order.id.slice(-8)}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FaUser className="text-gray-400" />
                                        <span className="text-gray-600">{order.client?.name || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    En attente de livreur
                                </div>
                            </div>

                            {/* Informations de livraison */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-gray-400" />
                                    <span className="text-sm text-gray-700">{order.delivery_address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaPhone className="text-gray-400" />
                                    <span className="text-sm text-gray-700">{order.delivery_phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaShoppingBag className="text-gray-400" />
                                    <span className="text-sm text-gray-700">
                                        {order.order_items?.length || 0} article(s)
                                    </span>
                                </div>
                            </div>

                            {/* Articles de la commande */}
                            <div className="border-t pt-3 mb-4">
                                <h4 className="font-semibold text-gray-700 mb-2">Articles :</h4>
                                <div className="space-y-2">
                                    {order.order_items?.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                {item.product?.name} × {item.quantity}
                                            </span>
                                            <span className="font-semibold">
                                                {formatPrice(item.total_price, order.currency)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total et bouton d'acceptation */}
                            <div className="border-t pt-4 flex justify-between items-center">
                                <div>
                                    <div className="text-lg font-bold text-[var(--app-orange)]">
                                        {formatPrice(order.total, order.currency)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Vendeur: {order.seller?.name || 'N/A'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => acceptOrder(order.id)}
                                    disabled={acceptingOrder === order.id}
                                    className="bg-[var(--app-orange)] hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition duration-300 disabled:opacity-50"
                                >
                                    {acceptingOrder === order.id ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Acceptation...
                                        </>
                                    ) : (
                                        <>
                                            <FaTruck />
                                            Accepter la livraison
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Date de la commande */}
                            <div className="text-xs text-gray-500 mt-3">
                                Commandé le {new Date(order.created_at).toLocaleDateString('fr-FR')} à {new Date(order.created_at).toLocaleTimeString('fr-FR')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}