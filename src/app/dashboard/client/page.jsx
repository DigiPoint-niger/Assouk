// Fichier : src/app/dashboard/client/page.jsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useCurrency } from '@/context/CurrencyContext';
import { 
    FaShoppingCart, 
    FaDollarSign, 
    FaHourglassHalf, 
    FaCheckCircle, 
    FaSpinner, 
    FaBoxOpen,
    FaCircle
} from 'react-icons/fa';
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

const RecentOrder = ({ order }) => (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
        <div className="flex items-center gap-3">
            <FaBoxOpen className="text-gray-500" />
            <div>
                <p className="font-semibold text-sm">Commande #{order.id.substring(0, 8)}</p>
                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
        }`}>
            {order.status}
        </span>
    </div>
);

// --- Composant Principal ---

export default function ClientDashboardPage() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClientData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Récupérer toutes les commandes du client
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, total, status, created_at, currency')
                .eq('client_id', user.id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // Calculer les statistiques
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => {
                // On suppose que le total est toujours en XOF pour le calcul
                return sum + (order.currency === 'XOF' ? order.total : 0);
            }, 0);
            const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
            const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;

            setStats({ totalOrders, totalSpent, pendingOrders, completedOrders });

            // Commandes récentes
            setRecentOrders(orders.slice(0, 5));

            // Données pour le graphique (dépenses mensuelles sur 6 mois)
            const monthlySpending = {};
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            orders.forEach(order => {
                const orderDate = new Date(order.created_at);
                if (orderDate > sixMonthsAgo) {
                    const month = orderDate.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
                    if (!monthlySpending[month]) {
                        monthlySpending[month] = 0;
                    }
                    monthlySpending[month] += order.total;
                }
            });

            const chartFormattedData = Object.entries(monthlySpending)
                .map(([name, Dépenses]) => ({ name, Dépenses }))
                .reverse(); // Pour avoir les mois les plus récents à droite

            setChartData(chartFormattedData);

        } catch (err) {
            console.error("Erreur de chargement du dashboard client:", err);
            setError("Impossible de charger vos données. Veuillez réessayer plus tard.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)]" />
                <span className="ml-3 text-lg text-gray-700">Chargement de votre tableau de bord...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-xl flex items-center shadow-lg">
                <FaCircle className="text-2xl mr-3" />
                <span className='font-semibold'>Erreur : {error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Bienvenue sur votre Espace Client</h1>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Commandes Passées" value={stats.totalOrders} icon={FaShoppingCart} />
                <StatCard title="Dépenses Totales" value={formatPrice(stats.totalSpent)} icon={FaDollarSign} />
                <StatCard title="Commandes en Cours" value={stats.pendingOrders} icon={FaHourglassHalf} />
                <StatCard title="Commandes Terminées" value={stats.completedOrders} icon={FaCheckCircle} />
            </div>

            {/* Graphiques et Commandes récentes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)]">Vos Dépenses Mensuelles</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value) => [formatPrice(value), 'Dépenses']} />
                            <Legend />
                            <Bar dataKey="Dépenses" fill="#ff9800" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)]">Commandes Récentes</h2>
                    <div className="space-y-3">
                        {recentOrders.length > 0 ? (
                            recentOrders.map(order => <RecentOrder key={order.id} order={order} />)
                        ) : (
                            <p className="text-center text-gray-500 py-8">Aucune commande récente.</p>
                        )}
                    </div>
                    <Link href="/dashboard/client/orders" className="block text-center mt-4 text-[var(--company-blue)] font-semibold hover:underline">
                        Voir toutes les commandes
                    </Link>
                </div>
            </div>
        </div>
    );
}

