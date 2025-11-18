// Fichier : src/app/dashboard/deliverer/page.jsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useCurrency } from '@/context/CurrencyContext';
import { 
    FaMoneyBillWave, 
    FaTruck, 
    FaStar, 
    FaHourglassHalf, 
    FaSpinner,
    FaClipboardList,
    FaHistory
    } from 'react-icons/fa';
    import { FaCircleXmark } from 'react-icons/fa6';
import Link from 'next/link';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';

// --- Composants ---

const StatCard = ({ title, value, icon: Icon, link }) => (
    <Link href={link || "#"} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] block">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
            <Icon className="text-3xl text-[var(--app-dark-blue)]" />
        </div>
        <div className="text-4xl font-extrabold text-[var(--app-orange)]">{value}</div>
    </Link>
);

// --- Composant Principal ---

export default function DelivererDashboardPage() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [stats, setStats] = useState({
        totalEarnings: 0,
        completedDeliveries: 0,
        pendingDeliveries: 0,
        averageRating: 0,
        deliveryFee: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feeEdit, setFeeEdit] = useState(false);
    const [newFee, setNewFee] = useState(0);
    const [feeLoading, setFeeLoading] = useState(false);
    const [feeError, setFeeError] = useState('');
    const [assignedOrders, setAssignedOrders] = useState([]);

    const fetchDelivererData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Récupérer les commandes assignées au livreur
            const { data: deliveries, error: deliveriesError } = await supabase
                .from('orders')
                .select('id, status, delivery_fee, created_at, client_id, delivery_address, delivery_phone, total, currency, payment_method, payment_status')
                .eq('deliverer_id', user.id);

            if (deliveriesError) throw deliveriesError;

            setAssignedOrders(deliveries);

            // Récupérer la note moyenne et le tarif du livreur
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('avg_rating, delivery_fee')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            // Calculer les statistiques
            const completedDeliveries = deliveries.filter(d => d.status === 'delivered' || d.status === 'completed');
            const totalEarnings = completedDeliveries.reduce((sum, d) => sum + (d.delivery_fee || 0), 0);
            const pendingDeliveries = deliveries.filter(d => d.status === 'delivering').length;

            setStats({
                totalEarnings,
                completedDeliveries: completedDeliveries.length,
                pendingDeliveries,
                averageRating: profile.avg_rating || 0,
                deliveryFee: profile.delivery_fee || 0,
            });

            // Données pour le graphique (livraisons mensuelles sur 6 mois)
            const monthlyDeliveries = {};
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            completedDeliveries.forEach(delivery => {
                const deliveryDate = new Date(delivery.created_at);
                if (deliveryDate > sixMonthsAgo) {
                    const month = deliveryDate.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
                    if (!monthlyDeliveries[month]) {
                        monthlyDeliveries[month] = 0;
                    }
                    monthlyDeliveries[month]++;
                }
            });

            const chartFormattedData = Object.entries(monthlyDeliveries)
                .map(([name, Livraisons]) => ({ name, Livraisons }))
                .reverse();

            setChartData(chartFormattedData);

        } catch (err) {
            console.error("Erreur de chargement du dashboard livreur:", err);
            setError("Impossible de charger vos données. Veuillez réessayer plus tard.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDelivererData();
    }, [fetchDelivererData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)]" />
                <span className="ml-3 text-lg text-gray-700">Chargement de votre espace livreur...</span>
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
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord Livreur</h1>

            {/* Gestion du tarif */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <h2 className="text-xl font-bold mb-2 text-[var(--app-dark-blue)]">Mon tarif de livraison</h2>
                {feeEdit ? (
                    <form onSubmit={async e => {
                        e.preventDefault();
                        setFeeLoading(true);
                        setFeeError('');
                        try {
                            const { error } = await supabase
                                .from('profiles')
                                .update({ delivery_fee: newFee })
                                .eq('id', user.id);
                            if (error) throw error;
                            setStats(s => ({ ...s, deliveryFee: newFee }));
                            setFeeEdit(false);
                        } catch (err) {
                            setFeeError("Erreur lors de la mise à jour du tarif.");
                        } finally {
                            setFeeLoading(false);
                        }
                    }} className="flex items-center gap-3">
                        <input type="number" min="0" step="0.01" value={newFee} onChange={e => setNewFee(Number(e.target.value))} className="border p-2 rounded-lg w-32" />
                        <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold" disabled={feeLoading}>Valider</button>
                        <button type="button" className="ml-2 text-gray-500" onClick={() => setFeeEdit(false)}>Annuler</button>
                        {feeError && <span className="text-red-600 ml-3">{feeError}</span>}
                    </form>
                ) : (
                    <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold">{formatPrice(stats.deliveryFee)}</span>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold" onClick={() => { setFeeEdit(true); setNewFee(stats.deliveryFee); }}>Modifier</button>
                    </div>
                )}
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Gains Totaux" value={formatPrice(stats.totalEarnings)} icon={FaMoneyBillWave} link="/dashboard/deliverer/earnings" />
                <StatCard title="Livraisons Effectuées" value={stats.completedDeliveries} icon={FaTruck} link="/dashboard/deliverer/history" />
                <StatCard title="Livraisons en Cours" value={stats.pendingDeliveries} icon={FaHourglassHalf} link="/dashboard/deliverer/deliveries" />
                <StatCard title="Note Moyenne" value={`${stats.averageRating.toFixed(1)} / 5`} icon={FaStar} link="#" />
            </div>

            {/* Graphique et Actions Rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)]">Activité Mensuelle</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [value, 'Livraisons']} />
                            <Legend />
                            <Bar dataKey="Livraisons" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-xl font-bold text-[var(--app-dark-blue)]">Actions Rapides</h2>
                    <Link href="/dashboard/deliverer/new-orders" className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                        <FaClipboardList className="text-blue-600 text-2xl" />
                        <span className="font-semibold text-blue-800">Voir les nouvelles commandes</span>
                    </Link>
                    <Link href="/dashboard/deliverer/history" className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition">
                        <FaHistory className="text-green-600 text-2xl" />
                        <span className="font-semibold text-green-800">Historique des livraisons</span>
                    </Link>
                </div>
            </div>

            {/* Commandes assignées */}
            <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
                <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)]">Mes commandes assignées</h2>
                {assignedOrders.length === 0 ? (
                    <div className="text-gray-500">Aucune commande assignée pour le moment.</div>
                ) : (
                    <ul className="space-y-4">
                        {assignedOrders.map(order => (
                            <li key={order.id} className="border rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-lg">Commande #{order.id}</span>
                                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100">{order.status}</span>
                                </div>
                                <div className="mb-2 text-sm text-gray-700">Client: {order.client_id}</div>
                                <div className="mb-2 text-sm text-gray-700">Adresse: {order.delivery_address}</div>
                                <div className="mb-2 text-sm text-gray-700">Téléphone: {order.delivery_phone}</div>
                                <div className="mb-2 text-sm text-gray-700">Montant total: {formatPrice(order.total, order.currency)}</div>
                                <div className="mb-2 text-sm text-gray-700">Frais livraison: {formatPrice(order.delivery_fee, order.currency)}</div>
                                <div className="mb-2 text-sm text-gray-700">Méthode paiement: {order.payment_method}</div>
                                <div className="mb-2 text-sm text-gray-700">Statut paiement: {order.payment_status}</div>
                                {order.status === 'confirmed' && (
                                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold mt-2" onClick={async () => {
                                        // Le livreur accepte la commande, statut passe à delivering et le delivery_fee est appliqué
                                        const { error } = await supabase
                                            .from('orders')
                                            .update({ status: 'delivering', delivery_fee: stats.deliveryFee })
                                            .eq('id', order.id);
                                        if (!error) fetchDelivererData();
                                    }}>Accepter la commande</button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

