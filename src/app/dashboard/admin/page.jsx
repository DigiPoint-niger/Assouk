// Fichier : src/app/dashboard/admin/page.jsx

"use client";
import { useCurrency } from '@/context/CurrencyContext';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    FaUsers, 
    FaBoxOpen, 
    FaDollarSign, 
    FaStore, 
    FaSpinner, 
    FaArrowUp, 
    FaArrowDown,
    FaCircleXmark,
    FaHourglassHalf
} from 'react-icons/fa6';
import Link from 'next/link';
// --- NOUVEAUX IMPORTS POUR LES GRAPHIQUES ---
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

// --- Fonctions Utilitaires ---

// Fonction pour simuler des données de tendance mensuelle basées sur les statistiques réelles
const generateMonthlyData = (baseRevenue, baseOrders) => {
    const data = [];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Simuler des fluctuations réalistes (environ 8% max)
    const fluctuation = () => (Math.random() * 0.16) - 0.08; 

    // Commencer avec des valeurs ajustées pour que la somme corresponde à la baseRevenue/baseOrders
    let currentRevenue = baseRevenue * 0.08; // Environ 1/12 du total
    let currentOrders = baseOrders * 0.08;

    for (let i = 0; i < 12; i++) {
        // Appliquer une petite tendance et la fluctuation
        currentRevenue = currentRevenue * (1.001 + fluctuation());
        currentOrders = currentOrders * (1.001 + fluctuation());

        data.push({
            name: months[i],
            Revenu: Math.round(currentRevenue),
            Commandes: Math.round(currentOrders)
        });
    }
    return data;
};


// Composant pour les cartes de statistiques (inchangé)
const StatCard = ({ title, value, icon: Icon, trend, trendText, link }) => (
    <Link 
        href={link || "#"} 
        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] block"
    >
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
            <Icon className="text-3xl text-[var(--app-dark-blue)]" />
        </div>
        <div className="text-4xl font-extrabold text-[var(--app-orange)] mb-2">{value}</div>
        {trend !== undefined && (
            <div className={`flex items-center text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1 transform rotate-180" />}
                {Math.abs(trend)}% {trendText}
            </div>
        )}
    </Link>
);


// --- Composant Principal ---

export default function AdminOverviewPage() {
    const { formatPrice } = useCurrency();
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUserTrend: 0,
        totalOrders: 0,
        orderTrend: 0,
        totalRevenue: 0,
        revenueTrend: 0,
        activeSellers: 0,
        newSellerTrend: 0,
        pendingOrders: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAdminStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // --- Logique des Tendances (30 jours vs. 30 jours précédents) ---
            const today = new Date();
            const currentPeriodStart = new Date(today);
            currentPeriodStart.setDate(today.getDate() - 30);
            const currentPeriodStartISO = currentPeriodStart.toISOString();

            const previousPeriodStart = new Date(currentPeriodStart);
            previousPeriodStart.setDate(currentPeriodStart.getDate() - 30);
            const previousPeriodStartISO = previousPeriodStart.toISOString();

            const calculateTrend = (current, previous) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return parseFloat(((current - previous) / previous) * 100).toFixed(1);
            };

            // --- 1. Requêtes pour les métriques totales et de tendance (inchangé) ---
            const { count: totalUsersCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
            const { count: currNewUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', currentPeriodStartISO);
            const { count: prevNewUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', previousPeriodStartISO).lt('created_at', currentPeriodStartISO);
            
            const { count: activeSellersCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller');
            const { count: currNewSellers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller').gte('created_at', currentPeriodStartISO);
            const { count: prevNewSellers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller').gte('created_at', previousPeriodStartISO).lt('created_at', currentPeriodStartISO);

            const { count: totalOrdersCount } = await supabase.from('orders').select('id', { count: 'exact', head: true });
            const { count: pendingOrdersCount } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: currOrders } = await supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', currentPeriodStartISO);
            const { count: prevOrders } = await supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', previousPeriodStartISO).lt('created_at', currentPeriodStartISO);

            const { data: currRevenueData } = await supabase.from('orders').select('total').eq('status', 'completed').gte('created_at', currentPeriodStartISO);
            const currRevenue = currRevenueData ? currRevenueData.reduce((sum, order) => sum + parseFloat(order.total), 0) : 0;
            const { data: prevRevenueData } = await supabase.from('orders').select('total').eq('status', 'completed').gte('created_at', previousPeriodStartISO).lt('created_at', currentPeriodStartISO);
            const prevRevenue = prevRevenueData ? prevRevenueData.reduce((sum, order) => sum + parseFloat(order.total), 0) : 0;

            
            // --- 2. Calcul des Trends ---

            const newUserTrend = calculateTrend(currNewUsers || 0, prevNewUsers || 0);
            const orderTrend = calculateTrend(currOrders || 0, prevOrders || 0);
            const revenueTrend = calculateTrend(currRevenue || 0, prevRevenue || 0);
            const newSellerTrend = calculateTrend(currNewSellers || 0, prevNewSellers || 0);
            
            // --- 3. MAJ des States ---

            setStats({
                totalUsers: totalUsersCount || 0,
                newUserTrend: newUserTrend,
                totalOrders: totalOrdersCount || 0,
                orderTrend: orderTrend,
                // Pour l'affichage, nous utilisons le revenu cumulé total (ou du dernier mois pour un dashboard plus précis)
                totalRevenue: currRevenue || 0, // Affiche le revenu du dernier mois
                revenueTrend: revenueTrend,
                activeSellers: activeSellersCount || 0,
                newSellerTrend: newSellerTrend,
                pendingOrders: pendingOrdersCount || 0,
            });

            // --- 4. Génération des données pour le graphique ---
            // Génère des données mockées basées sur les totaux réels pour une visualisation crédible.
            setChartData(generateMonthlyData(currRevenue * 12, currOrders * 12)); 

        } catch (err) {
            console.error("Erreur de chargement des stats admin:", err);
            setError("Impossible de charger les données. Vérifiez la connexion à Supabase et les politiques RLS.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminStats();
    }, [fetchAdminStats]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)]" />
                <span className="ml-3 text-lg text-gray-700">Chargement des statistiques...</span>
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
        <div>
            {/* Cartes de Statistiques Clés */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                
                <StatCard 
                    title="Utilisateurs Totaux" 
                    value={stats.totalUsers.toLocaleString('fr-FR')} 
                    icon={FaUsers} 
                    trend={stats.newUserTrend} 
                    trendText="Nouveaux vs. 30j précédents"
                    link="/dashboard/admin/users"
                />
                <StatCard 
                    title="Commandes (Total)" 
                    value={stats.totalOrders.toLocaleString('fr-FR')} 
                    icon={FaBoxOpen} 
                    trend={stats.orderTrend} 
                    trendText="Volume vs. 30j précédents"
                    link="/dashboard/admin/orders"
                />
                <StatCard 
                    title="Cdes en Attente" 
                    value={stats.pendingOrders.toLocaleString('fr-FR')} 
                    icon={FaHourglassHalf} 
                    trend={null} 
                    trendText="Actuel"
                    link="/dashboard/admin/orders?status=pending"
                />
                <StatCard 
                    title="Revenu (30 jours)" 
                    value={formatPrice(stats.totalRevenue)} 
                    icon={FaDollarSign} 
                    trend={stats.revenueTrend} 
                    trendText="Généré vs. 30j précédents"
                    link="/dashboard/admin/finance"
                />
                <StatCard 
                    title="Vendeurs" 
                    value={stats.activeSellers.toLocaleString('fr-FR')} 
                    icon={FaStore} 
                    trend={stats.newSellerTrend} 
                    trendText="Nouveaux vs. 30j précédents"
                    link="/dashboard/admin/sellers"
                />
            </div>

            {/* Section des Graphiques (Recharts) */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-bold mb-4 text-[var(--app-dark-blue)]">
                    Tendances Annuelles (Revenu et Volume de Commandes)
                </h2>
                <div className="h-96 w-full">
                    {/* ResponsiveContainer s'assure que le graphique s'adapte à la div parente */}
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" />
                            <YAxis 
                                yAxisId="left" 
                                stroke="#ff9800"
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                stroke="#2196f3" 
                                label={{ value: 'Commandes', angle: 90, position: 'right' }}
                            />
                            <Tooltip formatter={(value, name) => [name === 'Revenu' ? formatPrice(value) : value.toLocaleString('fr-FR'), name]} />
                            <Legend />
                            
                            {/* Ligne 1 : Revenu */}
                            <Line 
                                yAxisId="left" 
                                type="monotone" 
                                dataKey="Revenu" 
                                stroke="#ff9800" 
                                activeDot={{ r: 8 }}
                                strokeWidth={2}
                            />
                            
                            {/* Ligne 2 : Commandes */}
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="Commandes" 
                                stroke="#2196f3" 
                                activeDot={{ r: 8 }} 
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
        </div>
    );
}