// Fichier : src/components/dashboard/AdminSidebar.jsx

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    FaChartLine, 
    FaBoxOpen, 
    FaUsers, 
    FaGear, 
    FaRightFromBracket, 
    FaArrowLeft,
    FaXmark,
    FaTag,
    FaCrown,
    FaCreditCard,
    FaPercent,
    FaAdn,
    FaShop,
    FaMoneyBillWave,
    FaCoins,
    FaBox
} from 'react-icons/fa6';
import { useAuth } from '@/context/AuthProvider'; 

// Définition des liens pour l'Admin avec icônes appropriées
const adminLinks = [
    { href: '/dashboard/admin', icon: FaChartLine, label: 'Vue d\'Ensemble' },
    { href: '/dashboard/admin/orders', icon: FaBoxOpen, label: 'Gestion des Commandes' },
    { href: '/dashboard/admin/products', icon: FaBox, label: 'Gestion des Produits' },
    { href: '/dashboard/admin/users', icon: FaUsers, label: 'Gestion des Utilisateurs' },
    { href: '/dashboard/admin/categories', icon: FaTag, label: 'Gestion des Catégories' },
    { href: '/dashboard/admin/plans', icon: FaCrown, label: 'Gestion des Plans' },
    { href: '/dashboard/admin/subscriptions', icon: FaCreditCard, label: 'Gestion des Abonnements' },
    { href: '/dashboard/admin/featureds', icon: FaPercent, label: 'Gestion de Vedette' },
    { href: '/dashboard/admin/ads', icon: FaAdn, label: 'Gestion des Publicités' },
    { href: '/dashboard/admin/currencies', icon: FaCoins, label: 'Gestion des Devises' },
    { href: '/dashboard/admin/sales', icon: FaShop, label: 'Gestion des Ventes' },
    { href: '/dashboard/admin/payments', icon: FaMoneyBillWave, label: 'Gestion des Versements' },
    { href: '/dashboard/admin/settings', icon: FaGear, label: 'Paramètres' },
];

export default function AdminSidebar({ isOpen, toggleSidebar }) {
    const pathname = usePathname();
    const { signOut } = useAuth(); 

    const handleLogout = async () => {
        if (typeof signOut === 'function') {
            await signOut();
        }
    };

    return (
        <>
            {/* Overlay pour Mobile et Desktop */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 block' : 'opacity-0 hidden pointer-events-none'
                }`}
                onClick={toggleSidebar}
            ></div>

            {/* Sidebar principale - Toujours caché par défaut */}
            <aside 
                className={`fixed top-0 left-0 w-64 bg-[var(--app-dark-blue)] text-white flex flex-col h-full z-50 shadow-xl 
                    transform transition-transform duration-300 
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header / Logo et bouton de fermeture */}
                <div className="p-6 border-b border-blue-700 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-extrabold text-[var(--app-orange)] hover:text-white transition">
                        ASSOUK Admin
                    </Link>
                    <button 
                        onClick={toggleSidebar} 
                        className="text-white hover:text-red-400"
                        aria-label="Fermer le menu"
                    >
                        <FaXmark className="text-2xl" />
                    </button>
                </div>

                {/* Navigation principale */}
                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    {adminLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => {
                                // Sur mobile, fermer le sidebar après clic
                                if (window.innerWidth < 1024) {
                                    toggleSidebar();
                                }
                            }}
                            className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                                pathname === link.href 
                                    ? 'bg-[var(--company-blue)] text-white font-bold shadow-md'
                                    : 'hover:bg-blue-700 text-blue-100'
                            }`}
                        >
                            <link.icon className="mr-3 text-xl" />
                            <span className="text-sm">{link.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Footer / Déconnexion */}
                <div className="p-4 border-t border-blue-700 space-y-2">
                    <Link
                        href="/"
                        className="flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 text-blue-100"
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                toggleSidebar();
                            }
                        }}
                    >
                        <FaArrowLeft className="mr-3 text-xl" />
                        <span className="text-sm">Retour au Site</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                        <FaRightFromBracket className="mr-3 text-xl" /> 
                        <span className="text-sm">Déconnexion</span>
                    </button>
                </div>
            </aside>
        </>
    );
}