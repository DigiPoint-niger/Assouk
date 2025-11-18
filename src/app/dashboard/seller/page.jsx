// Fichier : src/app/dashboard/seller/page.jsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useCurrency } from '@/context/CurrencyContext';
import { 
    FaDollarSign, 
    FaBoxOpen, 
    FaShoppingCart, 
    FaHourglassHalf, 
    FaSpinner,
    FaPlusCircle,
    FaListAlt,
    FaCircle
} from 'react-icons/fa';
import Link from 'next/link';
import { 
    LineChart, 
    Line, 
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

const generateMonthlyData = (baseRevenue, baseOrders) => {
    const data = [];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const fluctuation = () => (Math.random() * 0.16) - 0.08;
    let currentRevenue = baseRevenue * 0.08;
    let currentOrders = baseOrders * 0.08;

    for (let i = 0; i < 12; i++) {
        currentRevenue *= (1.001 + fluctuation());
        currentOrders *= (1.001 + fluctuation());
        data.push({
            name: months[i],
            Revenu: Math.round(currentRevenue),
            Commandes: Math.round(currentOrders)
        });
    }
    return data;
};

// --- Composant Principal ---

export default function SellerDashboardPage() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        productsCount: 0,
        ordersCount: 0,
        pendingOrders: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSellerData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Récupérer les commandes associées au vendeur
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, total, status, currency')
                .eq('seller_id', user.id);

            if (ordersError) throw ordersError;

            // Récupérer les produits du vendeur
            const { count: productsCount, error: productsError } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('seller_id', user.id);

            if (productsError) throw productsError;

            // Calculer les statistiques
            const totalRevenue = orders
                .filter(o => o.status === 'delivered' || o.status === 'completed')
                .reduce((sum, order) => sum + (order.currency === 'XOF' ? order.total : 0), 0);

            const ordersCount = orders.length;
            const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

            setStats({
                totalRevenue,
                productsCount: productsCount || 0,
                ordersCount,
                pendingOrders,
            });

            // Générer des données de graphique simulées basées sur les totaux
            setChartData(generateMonthlyData(totalRevenue, ordersCount));

        } catch (err) {
            console.error("Erreur de chargement du dashboard vendeur:", err);
            setError("Impossible de charger vos données. Veuillez réessayer plus tard.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSellerData();
    }, [fetchSellerData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)]" />
                <span className="ml-3 text-lg text-gray-700">Chargement de votre espace vendeur...</span>
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
            <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord Vendeur</h1>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Revenu Total" value={formatPrice(stats.totalRevenue)} icon={FaDollarSign} />
                <StatCard title="Produits en Ligne" value={stats.productsCount} icon={FaBoxOpen} />
                <StatCard title="Commandes Reçues" value={stats.ordersCount} icon={FaShoppingCart} />
                <StatCard title="Commandes en Attente" value={stats.pendingOrders} icon={FaHourglassHalf} />
            </div>

            {/* Graphique et Actions Rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)]">Performance Annuelle</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" stroke="#ff9800" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#2196f3" />
                            <Tooltip formatter={(value, name) => [name === 'Revenu' ? formatPrice(value) : value, name]} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="Revenu" stroke="#ff9800" activeDot={{ r: 8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="Commandes" stroke="#2196f3" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                    <h2 className="text-xl font-bold text-[var(--app-dark-blue)]">Actions Rapides</h2>
                    <Link href="/dashboard/seller/products" className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                        <FaPlusCircle className="text-blue-600 text-2xl" />
                        <span className="font-semibold text-blue-800">Voir tout les produits</span>
                    </Link>
                    <Link href="/dashboard/seller/orders" className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition">
                        <FaListAlt className="text-green-600 text-2xl" />
                        <span className="font-semibold text-green-800">Voir toutes les commandes</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

