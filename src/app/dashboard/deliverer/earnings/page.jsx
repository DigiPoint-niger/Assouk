// Fichier : src/app/dashboard/deliverer/earnings/page.jsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useCurrency } from '@/context/CurrencyContext';
import { 
    FaMoneyBillWave, 
    FaWallet, 
    FaChartLine, 
    FaCalendarAlt,
    FaSpinner,
    FaTruck,
    FaReceipt
} from 'react-icons/fa';
import { FaCircleXmark } from 'react-icons/fa6';
import {
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

export default function DelivererEarningsPage() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('month'); // week, month, year
    const [earningsData, setEarningsData] = useState({
        totalEarnings: 0,
        completedDeliveries: 0,
        averageEarningPerDelivery: 0,
        pendingEarnings: 0,
        walletBalance: 0
    });
    const [chartData, setChartData] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [walletHistory, setWalletHistory] = useState([]);

    const fetchEarningsData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Récupérer toutes les livraisons complétées du livreur
            const { data: deliveries, error: deliveriesError } = await supabase
                .from('orders')
                .select('*')
                .eq('deliverer_id', user.id)
                .in('status', ['delivered', 'completed'])
                .order('created_at', { ascending: false });

            if (deliveriesError) throw deliveriesError;

            // Récupérer les livraisons en cours pour les gains en attente
            const { data: pendingDeliveries, error: pendingError } = await supabase
                .from('orders')
                .select('delivery_fee')
                .eq('deliverer_id', user.id)
                .eq('status', 'delivering');

            if (pendingError) throw pendingError;

            // Récupérer le solde du portefeuille
            const { data: wallet, error: walletError } = await supabase
                .from('wallets')
                .select('balance, currency')
                .eq('user_id', user.id)
                .single();

            if (walletError && walletError.code !== 'PGRST116') throw walletError;

            // Récupérer l'historique des transactions du portefeuille
            const { data: walletTransactions, error: transactionsError } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('wallet_id', wallet?.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (transactionsError) throw transactionsError;

            // Calculer les statistiques
            const totalEarnings = deliveries.reduce((sum, delivery) => sum + (delivery.delivery_fee || 0), 0);
            const pendingEarnings = pendingDeliveries.reduce((sum, delivery) => sum + (delivery.delivery_fee || 0), 0);
            const averageEarningPerDelivery = deliveries.length > 0 ? totalEarnings / deliveries.length : 0;

            setEarningsData({
                totalEarnings,
                completedDeliveries: deliveries.length,
                averageEarningPerDelivery,
                pendingEarnings,
                walletBalance: wallet?.balance || 0
            });

            setTransactions(deliveries);
            setWalletHistory(walletTransactions || []);

            // Préparer les données pour le graphique
            prepareChartData(deliveries, timeRange);

        } catch (err) {
            console.error("Erreur de chargement des gains:", err);
            setError("Impossible de charger les données de gains.");
        } finally {
            setLoading(false);
        }
    }, [user, timeRange]);

    const prepareChartData = (deliveries, range) => {
        const now = new Date();
        let groupByFormat;
        let dateRange;

        switch (range) {
            case 'week':
                groupByFormat = { weekday: 'short' };
                dateRange = 7;
                break;
            case 'month':
                groupByFormat = { day: 'numeric', month: 'short' };
                dateRange = 30;
                break;
            case 'year':
                groupByFormat = { month: 'short', year: '2-digit' };
                dateRange = 12;
                break;
            default:
                groupByFormat = { day: 'numeric', month: 'short' };
                dateRange = 30;
        }

        const groupedData = {};
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);

        // Initialiser toutes les périodes avec 0
        for (let i = dateRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            let key;
            
            if (range === 'week') {
                key = date.toLocaleDateString('fr-FR', { weekday: 'short' });
            } else if (range === 'month') {
                key = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            } else {
                key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            }
            
            groupedData[key] = 0;
        }

        // Remplir avec les données réelles
        deliveries.forEach(delivery => {
            const deliveryDate = new Date(delivery.created_at);
            if (deliveryDate >= startDate) {
                let key;
                
                if (range === 'week') {
                    key = deliveryDate.toLocaleDateString('fr-FR', { weekday: 'short' });
                } else if (range === 'month') {
                    key = deliveryDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                } else {
                    key = deliveryDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
                }
                
                if (groupedData[key] !== undefined) {
                    groupedData[key] += delivery.delivery_fee || 0;
                }
            }
        });

        const chartData = Object.entries(groupedData).map(([name, Gains]) => ({
            name,
            Gains: Math.round(Gains * 100) / 100 // Arrondir à 2 décimales
        }));

        setChartData(chartData);
    };

    useEffect(() => {
        fetchEarningsData();
    }, [fetchEarningsData]);

    const handleWithdraw = async () => {
        if (!user || earningsData.walletBalance <= 0) return;

        try {
            // Logique de retrait - à adapter selon votre système de paiement
            const { error } = await supabase
                .from('wallet_transactions')
                .insert({
                    wallet_id: null, // À remplacer par l'ID réel du wallet
                    type: 'debit',
                    amount: earningsData.walletBalance,
                    currency: 'XAF',
                    description: 'Retrait des gains'
                });

            if (error) throw error;

            alert('Demande de retrait envoyée avec succès!');
            fetchEarningsData(); // Recharger les données
        } catch (err) {
            console.error("Erreur lors du retrait:", err);
            alert("Erreur lors de la demande de retrait.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)]" />
                <span className="ml-3 text-lg text-gray-700">Chargement de vos gains...</span>
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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Mes Gains</h1>
                <div className="flex gap-2 bg-white p-2 rounded-lg shadow">
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            timeRange === 'week' 
                            ? 'bg-[var(--app-dark-blue)] text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        Semaine
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            timeRange === 'month' 
                            ? 'bg-[var(--app-dark-blue)] text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        Mois
                    </button>
                    <button
                        onClick={() => setTimeRange('year')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            timeRange === 'year' 
                            ? 'bg-[var(--app-dark-blue)] text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        Année
                    </button>
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-600">Gains Totaux</h3>
                        <FaMoneyBillWave className="text-3xl text-green-500" />
                    </div>
                    <div className="text-4xl font-extrabold text-green-600">
                        {formatPrice(earningsData.totalEarnings)}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Depuis le début</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-600">Portefeuille</h3>
                        <FaWallet className="text-3xl text-blue-500" />
                    </div>
                    <div className="text-4xl font-extrabold text-blue-600">
                        {formatPrice(earningsData.walletBalance)}
                    </div>
                    <button 
                        onClick={handleWithdraw}
                        disabled={earningsData.walletBalance <= 0}
                        className="mt-2 bg-[var(--app-orange)] text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Retirer
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-600">Moyenne/Livraison</h3>
                        <FaChartLine className="text-3xl text-purple-500" />
                    </div>
                    <div className="text-4xl font-extrabold text-purple-600">
                        {formatPrice(earningsData.averageEarningPerDelivery)}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Par commande livrée</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-600">En Attente</h3>
                        <FaTruck className="text-3xl text-orange-500" />
                    </div>
                    <div className="text-4xl font-extrabold text-orange-600">
                        {formatPrice(earningsData.pendingEarnings)}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Livraisons en cours</p>
                </div>
            </div>

            {/* Graphique des gains */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)]">
                    Évolution des Gains ({timeRange === 'week' ? '7 derniers jours' : timeRange === 'month' ? '30 derniers jours' : '12 derniers mois'})
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                            formatter={(value) => [formatPrice(value), 'Gains']}
                            labelFormatter={(label) => `Période: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="Gains" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Dernières transactions et historique du portefeuille */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Dernières livraisons payées */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)] flex items-center gap-2">
                        <FaTruck />
                        Dernières Livraisons Payées
                    </h2>
                    {transactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Aucune livraison payée pour le moment.</p>
                    ) : (
                        <div className="space-y-4">
                            {transactions.slice(0, 5).map((transaction) => (
                                <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <div className="font-semibold">Commande #{transaction.id.slice(-8)}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-green-600">
                                            +{formatPrice(transaction.delivery_fee)}
                                        </div>
                                        <div className="text-sm text-gray-500 capitalize">
                                            {transaction.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Historique du portefeuille */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)] flex items-center gap-2">
                        <FaReceipt />
                        Historique du Portefeuille
                    </h2>
                    {walletHistory.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Aucune transaction dans le portefeuille.</p>
                    ) : (
                        <div className="space-y-4">
                            {walletHistory.map((transaction) => (
                                <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <div className="font-semibold">{transaction.description}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                    <div className={`font-bold ${
                                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {transaction.type === 'credit' ? '+' : '-'}{formatPrice(transaction.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Résumé détaillé */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)]">Résumé des Performances</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{earningsData.completedDeliveries}</div>
                        <div className="text-gray-600">Livraisons Complétées</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {earningsData.completedDeliveries > 0 
                                ? Math.round((earningsData.totalEarnings / earningsData.completedDeliveries) * 100) / 100 
                                : 0}
                        </div>
                        <div className="text-gray-600">Gain Moyen (par livraison)</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                            {formatPrice(earningsData.pendingEarnings)}
                        </div>
                        <div className="text-gray-600">Gains en Attente</div>
                    </div>
                </div>
            </div>
        </div>
    );
}