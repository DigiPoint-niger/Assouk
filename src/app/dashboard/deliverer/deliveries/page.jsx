// Fichier : src/app/dashboard/deliverer/deliveries/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useCurrency } from '@/context/CurrencyContext';
import { 
    FaTruck, 
    FaMapMarkerAlt, 
    FaPhone, 
    FaUser,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaSpinner,
    FaExclamationTriangle,
    FaShoppingBag,
    FaMoneyBillWave
} from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';

export default function DelivererDeliveriesPage() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [showDeliveryNotes, setShowDeliveryNotes] = useState(null);
    const [deliveryNotes, setDeliveryNotes] = useState('');

    useEffect(() => {
        fetchActiveDeliveries();
    }, [user]);

    const fetchActiveDeliveries = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    client:profiles!orders_client_id_fkey(name, phone, avg_rating),
                    seller:profiles!orders_seller_id_fkey(name, phone),
                    order_items(
                        quantity,
                        unit_price,
                        total_price,
                        product:products(name, images)
                    )
                `)
                .eq('deliverer_id', user.id)
                .in('status', ['confirmed', 'delivering'])
                .order('created_at', { ascending: true });

            if (error) throw error;

            setActiveDeliveries(data || []);
        } catch (err) {
            console.error("Erreur de chargement des livraisons:", err);
            setError("Impossible de charger vos livraisons en cours.");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus, notes = '') => {
        if (!user) return;

        setUpdatingOrder(orderId);
        try {
            const updateData = { 
                status: newStatus 
            };

            // Si on marque comme livrée, on ajoute la date de livraison
            if (newStatus === 'delivered') {
                updateData.delivery_completed_at = new Date().toISOString();
                if (notes) {
                    updateData.delivery_notes = notes;
                }
            }

            // Si on annule, on libère le livreur
            if (newStatus === 'canceled') {
                updateData.deliverer_id = null;
            }

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;

            // Recharger la liste
            await fetchActiveDeliveries();
            
            if (newStatus === 'delivered') {
                setShowDeliveryNotes(null);
                setDeliveryNotes('');
            }

        } catch (err) {
            console.error("Erreur lors de la mise à jour:", err);
            alert("Erreur lors de la mise à jour du statut. Veuillez réessayer.");
        } finally {
            setUpdatingOrder(null);
        }
    };

    const startDelivery = async (orderId) => {
        if (!user) return;

        setUpdatingOrder(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ 
                    status: 'delivering',
                    delivery_started_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;

            await fetchActiveDeliveries();
            
        } catch (err) {
            console.error("Erreur lors du début de livraison:", err);
            alert("Erreur lors du début de la livraison. Veuillez réessayer.");
        } finally {
            setUpdatingOrder(null);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'confirmed':
                return {
                    color: 'bg-blue-100 text-blue-800',
                    text: 'Confirmée - En attente de prise en charge',
                    icon: FaClock,
                    iconColor: 'text-blue-500'
                };
            case 'delivering':
                return {
                    color: 'bg-orange-100 text-orange-800',
                    text: 'En cours de livraison',
                    icon: FaTruck,
                    iconColor: 'text-orange-500'
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800',
                    text: status,
                    icon: FaClock,
                    iconColor: 'text-gray-500'
                };
        }
    };

    const getUrgencyColor = (createdAt) => {
        const orderDate = new Date(createdAt);
        const now = new Date();
        const hoursDiff = (now - orderDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) return 'bg-red-50 border-l-4 border-l-red-500';
        if (hoursDiff > 12) return 'bg-orange-50 border-l-4 border-l-orange-500';
        return 'bg-white';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)]" />
                <span className="ml-3 text-lg text-gray-700">Chargement de vos livraisons...</span>
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
                <h1 className="text-3xl font-bold text-gray-800">Mes Livraisons en Cours</h1>
                <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
                    <FaTruck className="text-xl" />
                    <span className="font-semibold">{activeDeliveries.length} livraison(s) active(s)</span>
                </div>
            </div>

            {activeDeliveries.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                    <FaCheckCircle className="text-6xl text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune livraison en cours</h3>
                    <p className="text-gray-500">Toutes vos livraisons sont terminées ou en attente de nouvelles commandes.</p>
                    <button 
                        onClick={fetchActiveDeliveries}
                        className="mt-4 bg-[var(--app-dark-blue)] text-white px-6 py-2 rounded-lg font-bold"
                    >
                        Actualiser
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeDeliveries.map((delivery) => {
                        const statusInfo = getStatusInfo(delivery.status);
                        const StatusIcon = statusInfo.icon;
                        const urgencyClass = getUrgencyColor(delivery.created_at);

                        return (
                            <div key={delivery.id} className={`bg-white p-6 rounded-xl shadow-lg ${urgencyClass}`}>
                                {/* En-tête de la commande */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">
                                            Commande #{delivery.id.slice(-8)}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-2">
                                                <StatusIcon className={`text-lg ${statusInfo.iconColor}`} />
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </div>
                                            {urgencyClass.includes('red') && (
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <FaExclamationTriangle />
                                                    <span className="text-sm font-semibold">URGENT</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-[var(--app-orange)]">
                                            {formatPrice(delivery.total, delivery.currency)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Frais: {formatPrice(delivery.delivery_fee, delivery.currency)}
                                        </div>
                                    </div>
                                </div>

                                {/* Informations de livraison */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <FaUser className="text-gray-400" />
                                                Informations Client
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                                <div><span className="font-medium">Nom:</span> {delivery.client?.name || 'N/A'}</div>
                                                <div><span className="font-medium">Téléphone:</span> {delivery.delivery_phone}</div>
                                                {delivery.client?.avg_rating && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">Note client:</span>
                                                        <FaStar className="text-yellow-400" />
                                                        <span>{delivery.client.avg_rating.toFixed(1)}/5</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-gray-400" />
                                                Adresse de Livraison
                                            </h4>
                                            <p className="text-sm text-gray-600">{delivery.delivery_address}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <FaShoppingBag className="text-gray-400" />
                                                Vendeur
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                                <div><span className="font-medium">Nom:</span> {delivery.seller?.name || 'N/A'}</div>
                                                <div><span className="font-medium">Téléphone:</span> {delivery.seller?.phone || 'N/A'}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Détails de Paiement</h4>
                                            <div className="space-y-1 text-sm">
                                                <div><span className="font-medium">Méthode:</span> {delivery.payment_method}</div>
                                                <div><span className="font-medium">Statut:</span> 
                                                    <span className={`ml-1 capitalize ${
                                                        delivery.payment_status === 'completed' ? 'text-green-600' : 
                                                        delivery.payment_status === 'failed' ? 'text-red-600' : 'text-orange-600'
                                                    }`}>
                                                        {delivery.payment_status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Articles de la commande */}
                                <div className="border-t pt-4 mb-6">
                                    <h4 className="font-semibold text-gray-700 mb-3">Articles de la commande :</h4>
                                    <div className="space-y-2">
                                        {delivery.order_items?.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {item.product?.images?.[0] && (
                                                        <img 
                                                            src={item.product.images[0]} 
                                                            alt={item.product?.name}
                                                            className="w-10 h-10 object-cover rounded"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-gray-800">
                                                            {item.product?.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {formatPrice(item.unit_price, delivery.currency)} × {item.quantity}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-[var(--app-orange)]">
                                                    {formatPrice(item.total_price, delivery.currency)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="border-t pt-4 flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Commandé le {new Date(delivery.created_at).toLocaleDateString('fr-FR')} à {' '}
                                        {new Date(delivery.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        {delivery.status === 'confirmed' && (
                                            <button
                                                onClick={() => startDelivery(delivery.id)}
                                                disabled={updatingOrder === delivery.id}
                                                className="bg-[var(--app-orange)] hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {updatingOrder === delivery.id ? (
                                                    <FaSpinner className="animate-spin" />
                                                ) : (
                                                    <FaTruck />
                                                )}
                                                Commencer la livraison
                                            </button>
                                        )}

                                        {delivery.status === 'delivering' && (
                                            <>
                                                <button
                                                    onClick={() => setShowDeliveryNotes(showDeliveryNotes === delivery.id ? null : delivery.id)}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
                                                >
                                                    Notes
                                                </button>
                                                
                                                <button
                                                    onClick={() => updateOrderStatus(delivery.id, 'canceled')}
                                                    disabled={updatingOrder === delivery.id}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {updatingOrder === delivery.id ? (
                                                        <FaSpinner className="animate-spin" />
                                                    ) : (
                                                        <FaTimesCircle />
                                                    )}
                                                    Annuler
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (showDeliveryNotes === delivery.id && deliveryNotes) {
                                                            updateOrderStatus(delivery.id, 'delivered', deliveryNotes);
                                                        } else {
                                                            setShowDeliveryNotes(delivery.id);
                                                        }
                                                    }}
                                                    disabled={updatingOrder === delivery.id}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {updatingOrder === delivery.id ? (
                                                        <FaSpinner className="animate-spin" />
                                                    ) : (
                                                        <FaCheckCircle />
                                                    )}
                                                    Livrée
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Zone de notes pour la livraison */}
                                {showDeliveryNotes === delivery.id && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                        <h5 className="font-semibold text-gray-700 mb-2">Notes de livraison (optionnel) :</h5>
                                        <textarea
                                            value={deliveryNotes}
                                            onChange={(e) => setDeliveryNotes(e.target.value)}
                                            placeholder="Ex: Livré au concierge, client absent, etc."
                                            className="w-full p-3 border rounded-lg resize-none"
                                            rows="3"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => {
                                                    setShowDeliveryNotes(null);
                                                    setDeliveryNotes('');
                                                }}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={() => updateOrderStatus(delivery.id, 'delivered', deliveryNotes)}
                                                disabled={updatingOrder === delivery.id}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                                            >
                                                Confirmer la livraison
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Instructions pour les livreurs */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Instructions importantes :</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                    <li>• Vérifiez toujours l'identité du client avant de remettre la commande</li>
                    <li>• Contactez le client si vous avez du mal à trouver l'adresse</li>
                    <li>• En cas de problème, contactez le support au +XXX XXX XXX</li>
                    <li>• Les notes de livraison aident à résoudre les litiges éventuels</li>
                </ul>
            </div>
        </div>
    );
}