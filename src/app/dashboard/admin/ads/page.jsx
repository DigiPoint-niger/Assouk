// Fichier : src/app/dashboard/admin/ads/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaBullhorn,
    FaEye,
    FaCalendarAlt,
    FaTimesCircle,
    FaCheckCircle,
    FaExclamationTriangle,
    FaImage,
    FaStore,
    FaMoneyBillWave,
    FaChartLine,
    FaLink,
    FaUser
} from 'react-icons/fa';

export default function AdsManagement() {
    const [ads, setAds] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [selectedAd, setSelectedAd] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [stats, setStats] = useState({});
    const [newAd, setNewAd] = useState({
        title: '',
        description: '',
        image: '',
        target_url: '',
        max_views: 1000,
        owner_id: '',
        is_active: true
    });

    // Charger les publicités avec les informations du propriétaire
    const fetchAds = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ads')
                .select(`
                    *,
                    owner:profiles!owner_id(name, phone, role),
                    ad_views(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Formater les données pour inclure le nombre de vues
            const formattedAds = (data || []).map(ad => ({
                ...ad,
                views_count: ad.ad_views?.[0]?.count || 0
            }));

            setAds(formattedAds);
            calculateStats(formattedAds);
        } catch (error) {
            console.error('Erreur lors du chargement des publicités:', error);
        } finally {
            setLoading(false);
        }
    };

    // Charger les utilisateurs (vendeurs) pour l'attribution des publicités
    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, role')
                .in('role', ['seller', 'admin'])
                .order('name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        }
    };

    // Calculer les statistiques
    const calculateStats = (adsData) => {
        const stats = {
            total: adsData.length,
            active: 0,
            inactive: 0,
            totalViews: 0,
            completionRate: 0,
            totalBudget: 0
        };

        adsData.forEach(ad => {
            if (ad.is_active) {
                stats.active++;
            } else {
                stats.inactive++;
            }
            stats.totalViews += ad.views_count || 0;
            stats.totalBudget += ad.max_views * 0.1; // Estimation du budget (0.1 FCFA par vue)
            
            // Taux de completion (vues actuelles / vues max)
            const completion = (ad.views_count / ad.max_views) * 100;
            if (completion > stats.completionRate) {
                stats.completionRate = completion;
            }
        });

        setStats(stats);
    };

    useEffect(() => {
        fetchAds();
        fetchUsers();
    }, []);

    // Filtrer les publicités
    const filteredAds = ads.filter(ad => {
        const matchesSearch = 
            ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ad.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && ad.is_active) ||
            (statusFilter === 'inactive' && !ad.is_active);
        
        return matchesSearch && matchesStatus;
    });

    // Créer une nouvelle publicité
    const createAd = async () => {
        if (!newAd.title || !newAd.owner_id) {
            alert('Le titre et le propriétaire sont obligatoires');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('ads')
                .insert([{
                    title: newAd.title,
                    description: newAd.description,
                    image: newAd.image,
                    target_url: newAd.target_url,
                    max_views: parseInt(newAd.max_views),
                    owner_id: newAd.owner_id,
                    is_active: newAd.is_active,
                    current_views: 0
                }])
                .select(`
                    *,
                    owner:profiles!owner_id(name, phone, role)
                `)
                .single();

            if (error) throw error;

            setAds([{ ...data, views_count: 0 }, ...ads]);
            calculateStats([{ ...data, views_count: 0 }, ...ads]);
            setIsCreateModalOpen(false);
            setNewAd({
                title: '',
                description: '',
                image: '',
                target_url: '',
                max_views: 1000,
                owner_id: '',
                is_active: true
            });
        } catch (error) {
            console.error('Erreur lors de la création de la publicité:', error);
            alert('Erreur lors de la création de la publicité');
        }
    };

    // Mettre à jour une publicité
    const updateAd = async () => {
        if (!editingAd.title || !editingAd.owner_id) {
            alert('Le titre et le propriétaire sont obligatoires');
            return;
        }

        try {
            const { error } = await supabase
                .from('ads')
                .update({
                    title: editingAd.title,
                    description: editingAd.description,
                    image: editingAd.image,
                    target_url: editingAd.target_url,
                    max_views: parseInt(editingAd.max_views),
                    owner_id: editingAd.owner_id,
                    is_active: editingAd.is_active
                })
                .eq('id', editingAd.id);

            if (error) throw error;

            const updatedAds = ads.map(ad => 
                ad.id === editingAd.id ? { ...editingAd, views_count: ad.views_count } : ad
            );
            setAds(updatedAds);
            calculateStats(updatedAds);
            setIsEditModalOpen(false);
            setEditingAd(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la publicité:', error);
            alert('Erreur lors de la mise à jour de la publicité');
        }
    };

    // Supprimer une publicité
    const deleteAd = async (adId, adTitle) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer la publicité "${adTitle}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('ads')
                .delete()
                .eq('id', adId);

            if (error) throw error;

            const updatedAds = ads.filter(ad => ad.id !== adId);
            setAds(updatedAds);
            calculateStats(updatedAds);
        } catch (error) {
            console.error('Erreur lors de la suppression de la publicité:', error);
            alert('Erreur lors de la suppression de la publicité');
        }
    };

    // Activer/désactiver une publicité
    const toggleAdStatus = async (adId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('ads')
                .update({ is_active: !currentStatus })
                .eq('id', adId);

            if (error) throw error;

            const updatedAds = ads.map(ad => 
                ad.id === adId ? { ...ad, is_active: !currentStatus } : ad
            );
            setAds(updatedAds);
            calculateStats(updatedAds);
        } catch (error) {
            console.error('Erreur lors de la modification du statut:', error);
        }
    };

    // Afficher les détails d'une publicité
    const viewAdDetails = (ad) => {
        setSelectedAd(ad);
        setIsDetailsModalOpen(true);
    };

    // Ouvrir le modal d'édition
    const openEditModal = (ad) => {
        setEditingAd({ ...ad });
        setIsEditModalOpen(true);
    };

    // Obtenir le pourcentage de progression des vues
    const getProgressPercentage = (ad) => {
        return Math.min((ad.views_count / ad.max_views) * 100, 100);
    };

    // Obtenir la couleur de la barre de progression
    const getProgressColor = (percentage) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    // Obtenir l'icône du statut
    const getStatusIcon = (isActive) => {
        return isActive ? 
            <FaCheckCircle className="text-green-500" /> : 
            <FaTimesCircle className="text-red-500" />;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des publicités...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Publicités</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredAds.length} publicité{filteredAds.length !== 1 ? 's' : ''} trouvée{filteredAds.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Barre de recherche */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une publicité..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                        
                        {/* Filtre par statut */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actives</option>
                            <option value="inactive">Inactives</option>
                        </select>
                        
                        {/* Bouton d'ajout */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-[var(--company-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                        >
                            <FaPlus />
                            Nouvelle Publicité
                        </button>
                    </div>
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Publicités</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <FaBullhorn className="text-3xl text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Publicités Actives</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
                            <p className="text-sm text-gray-500">
                                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% du total
                            </p>
                        </div>
                        <FaCheckCircle className="text-3xl text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total des Vues</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalViews?.toLocaleString()}</p>
                        </div>
                        <FaEye className="text-3xl text-purple-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Budget Estimé</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.totalBudget || 0)}
                            </p>
                        </div>
                        <FaMoneyBillWave className="text-3xl text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Tableau des publicités */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Publicité
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Propriétaire
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vues
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Progression
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date de création
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAds.map((ad) => {
                                const progressPercentage = getProgressPercentage(ad);
                                const progressColor = getProgressColor(progressPercentage);
                                
                                return (
                                    <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    {ad.image ? (
                                                        <img
                                                            src={ad.image}
                                                            alt={ad.title}
                                                            className="h-12 w-12 object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <FaImage className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {ad.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                                                        {ad.description || 'Aucune description'}
                                                    </div>
                                                    {ad.target_url && (
                                                        <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                                            <FaLink className="text-xs" />
                                                            {ad.target_url}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{ad.owner?.name}</div>
                                            <div className="text-sm text-gray-500 capitalize">
                                                {ad.owner?.role === 'admin' ? 'Administrateur' : 'Vendeur'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {ad.views_count?.toLocaleString()} / {ad.max_views?.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {Math.round(progressPercentage)}% complété
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${progressColor}`}
                                                    style={{ width: `${progressPercentage}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(ad.is_active)}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    ad.is_active 
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {ad.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(ad.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => viewAdDetails(ad)}
                                                    className="text-[var(--company-blue)] hover:text-[var(--app-dark-blue)] transition-colors"
                                                    title="Voir les détails"
                                                >
                                                    <FaEye className="text-lg" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(ad)}
                                                    className="text-green-600 hover:text-green-800 transition-colors"
                                                    title="Modifier la publicité"
                                                >
                                                    <FaEdit className="text-lg" />
                                                </button>
                                                <button
                                                    onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                                                    className={`${
                                                        ad.is_active 
                                                            ? 'text-yellow-600 hover:text-yellow-800' 
                                                            : 'text-green-600 hover:text-green-800'
                                                    } transition-colors`}
                                                    title={ad.is_active ? 'Désactiver' : 'Activer'}
                                                >
                                                    {ad.is_active ? <FaTimesCircle className="text-lg" /> : <FaCheckCircle className="text-lg" />}
                                                </button>
                                                <button
                                                    onClick={() => deleteAd(ad.id, ad.title)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                    title="Supprimer la publicité"
                                                >
                                                    <FaTrash className="text-lg" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredAds.length === 0 && (
                    <div className="text-center py-12">
                        <FaBullhorn className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm || statusFilter !== 'all'
                                ? "Aucune publicité ne correspond aux critères de recherche."
                                : "Aucune publicité n'a été créée pour le moment."
                            }
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-4 flex items-center gap-2 bg-[var(--company-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors mx-auto"
                            >
                                <FaPlus />
                                Créer la première publicité
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de création de publicité */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Nouvelle Publicité
                                </h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Titre de la publicité *
                                </label>
                                <input
                                    type="text"
                                    value={newAd.title}
                                    onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                                    placeholder="Titre attractif pour la publicité..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newAd.description}
                                    onChange={(e) => setNewAd({...newAd, description: e.target.value})}
                                    placeholder="Description détaillée de la publicité..."
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL de l'image
                                </label>
                                <input
                                    type="url"
                                    value={newAd.image}
                                    onChange={(e) => setNewAd({...newAd, image: e.target.value})}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL de destination
                                </label>
                                <input
                                    type="url"
                                    value={newAd.target_url}
                                    onChange={(e) => setNewAd({...newAd, target_url: e.target.value})}
                                    placeholder="https://example.com/landing-page"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre maximum de vues *
                                    </label>
                                    <input
                                        type="number"
                                        value={newAd.max_views}
                                        onChange={(e) => setNewAd({...newAd, max_views: e.target.value})}
                                        min="100"
                                        step="100"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Propriétaire *
                                    </label>
                                    <select
                                        value={newAd.owner_id}
                                        onChange={(e) => setNewAd({...newAd, owner_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    >
                                        <option value="">Sélectionner un propriétaire</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.role === 'admin' ? 'Admin' : 'Vendeur'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={newAd.is_active}
                                    onChange={(e) => setNewAd({...newAd, is_active: e.target.checked})}
                                    className="rounded border-gray-300 text-[var(--company-blue)] focus:ring-[var(--company-blue)]"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                    Publicité active
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={createAd}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Créer la publicité
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition de publicité */}
            {isEditModalOpen && editingAd && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Modifier la Publicité
                                </h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Titre de la publicité *
                                </label>
                                <input
                                    type="text"
                                    value={editingAd.title}
                                    onChange={(e) => setEditingAd({...editingAd, title: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editingAd.description || ''}
                                    onChange={(e) => setEditingAd({...editingAd, description: e.target.value})}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL de l'image
                                </label>
                                <input
                                    type="url"
                                    value={editingAd.image || ''}
                                    onChange={(e) => setEditingAd({...editingAd, image: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL de destination
                                </label>
                                <input
                                    type="url"
                                    value={editingAd.target_url || ''}
                                    onChange={(e) => setEditingAd({...editingAd, target_url: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre maximum de vues *
                                    </label>
                                    <input
                                        type="number"
                                        value={editingAd.max_views}
                                        onChange={(e) => setEditingAd({...editingAd, max_views: e.target.value})}
                                        min="100"
                                        step="100"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Propriétaire *
                                    </label>
                                    <select
                                        value={editingAd.owner_id}
                                        onChange={(e) => setEditingAd({...editingAd, owner_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    >
                                        <option value="">Sélectionner un propriétaire</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.role === 'admin' ? 'Admin' : 'Vendeur'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="edit_is_active"
                                    checked={editingAd.is_active}
                                    onChange={(e) => setEditingAd({...editingAd, is_active: e.target.checked})}
                                    className="rounded border-gray-300 text-[var(--company-blue)] focus:ring-[var(--company-blue)]"
                                />
                                <label htmlFor="edit_is_active" className="text-sm font-medium text-gray-700">
                                    Publicité active
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={updateAd}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Enregistrer les modifications
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de détails de la publicité */}
            {isDetailsModalOpen && selectedAd && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Détails de la Publicité
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
                            {/* Image de la publicité */}
                            {selectedAd.image && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Image de la publicité</h3>
                                    <img
                                        src={selectedAd.image}
                                        alt={selectedAd.title}
                                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                    />
                                </div>
                            )}

                            {/* Informations générales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations publicité</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Titre:</strong> {selectedAd.title}</p>
                                        <p><strong>Description:</strong> {selectedAd.description || 'Aucune description'}</p>
                                        <p><strong>URL de destination:</strong> {selectedAd.target_url || 'Aucune URL'}</p>
                                        <p><strong>Vues actuelles:</strong> {selectedAd.views_count?.toLocaleString()}</p>
                                        <p><strong>Vues maximum:</strong> {selectedAd.max_views?.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations propriétaire</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedAd.owner?.name}</p>
                                        <p><strong>Rôle:</strong> {selectedAd.owner?.role === 'admin' ? 'Administrateur' : 'Vendeur'}</p>
                                        <p><strong>Téléphone:</strong> {selectedAd.owner?.phone || 'Non renseigné'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Statistiques de performance */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Performance</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {Math.round(getProgressPercentage(selectedAd))}%
                                        </div>
                                        <div className="text-sm text-blue-800">Progression</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {selectedAd.views_count?.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-green-800">Vues actuelles</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {selectedAd.max_views?.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-purple-800">Vues maximum</div>
                                    </div>
                                </div>
                            </div>

                            {/* Barre de progression */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Progression des vues</h3>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div 
                                        className={`h-4 rounded-full ${getProgressColor(getProgressPercentage(selectedAd))}`}
                                        style={{ width: `${getProgressPercentage(selectedAd)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 mt-2">
                                    <span>{selectedAd.views_count?.toLocaleString()} vues</span>
                                    <span>{selectedAd.max_views?.toLocaleString()} vues max</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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