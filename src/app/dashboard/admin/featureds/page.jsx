// Fichier : src/app/dashboard/admin/featureds/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaStar,
    FaCalendarAlt,
    FaTimesCircle,
    FaCheckCircle,
    FaExclamationTriangle,
    FaImage,
    FaStore,
    FaMoneyBillWave,
    FaBox,
    FaChartLine
} from 'react-icons/fa';

export default function FeaturedProductsManagement() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [stats, setStats] = useState({});

    // Charger les produits en vedette et tous les produits
    const fetchData = async () => {
        setLoading(true);
        try {
            // Récupérer les catégories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('id, name')
                .order('name');

            if (categoriesError) throw categoriesError;
            setCategories(categoriesData || []);

            // Récupérer les produits en vedette avec les informations du vendeur et de la catégorie
            const { data: featuredData, error: featuredError } = await supabase
                .from('products')
                .select(`
                    *,
                    seller:profiles!seller_id(name, phone, badge),
                    category:categories(name)
                `)
                .eq('is_featured', true)
                .order('created_at', { ascending: false });

            if (featuredError) throw featuredError;

            // Récupérer tous les produits non vedettes pour la sélection
            const { data: allProductsData, error: allProductsError } = await supabase
                .from('products')
                .select(`
                    *,
                    seller:profiles!seller_id(name, phone, badge),
                    category:categories(name)
                `)
                .eq('is_featured', false)
                .order('created_at', { ascending: false });

            if (allProductsError) throw allProductsError;

            setFeaturedProducts(featuredData || []);
            setAllProducts(allProductsData || []);
            calculateStats(featuredData || []);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculer les statistiques
    const calculateStats = (featuredData) => {
        const stats = {
            total: featuredData.length,
            byCategory: {},
            totalValue: 0,
            averagePrice: 0
        };

        featuredData.forEach(product => {
            // Compter par catégorie
            const categoryName = product.category?.name || 'Non catégorisé';
            stats.byCategory[categoryName] = (stats.byCategory[categoryName] || 0) + 1;
            
            // Calculer la valeur totale
            stats.totalValue += product.price || 0;
        });

        stats.averagePrice = stats.total > 0 ? stats.totalValue / stats.total : 0;
        setStats(stats);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtrer les produits en vedette
    const filteredFeaturedProducts = featuredProducts.filter(product => {
        const matchesSearch = 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });

    // Ajouter un produit en vedette
    const addToFeatured = async (product) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_featured: true })
                .eq('id', product.id);

            if (error) throw error;

            // Mettre à jour les états locaux
            setFeaturedProducts([product, ...featuredProducts]);
            setAllProducts(allProducts.filter(p => p.id !== product.id));
            calculateStats([product, ...featuredProducts]);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Erreur lors de l\'ajout en vedette:', error);
            alert('Erreur lors de l\'ajout du produit en vedette');
        }
    };

    // Retirer un produit des vedettes
    const removeFromFeatured = async (productId, productName) => {
        if (!confirm(`Êtes-vous sûr de vouloir retirer "${productName}" des produits en vedette ?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('products')
                .update({ is_featured: false })
                .eq('id', productId);

            if (error) throw error;

            const removedProduct = featuredProducts.find(p => p.id === productId);
            setFeaturedProducts(featuredProducts.filter(p => p.id !== productId));
            setAllProducts([removedProduct, ...allProducts]);
            calculateStats(featuredProducts.filter(p => p.id !== productId));
        } catch (error) {
            console.error('Erreur lors du retrait des vedettes:', error);
            alert('Erreur lors du retrait du produit des vedettes');
        }
    };

    // Afficher les détails d'un produit
    const viewProductDetails = (product) => {
        setSelectedProduct(product);
        setIsDetailsModalOpen(true);
    };

    // Formater le prix
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(price);
    };

    // Obtenir le badge du vendeur
    const getSellerBadge = (badge) => {
        switch (badge) {
            case 'verified': return { label: 'Vérifié', color: 'bg-green-100 text-green-800' };
            case 'pending': return { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' };
            default: return { label: 'Standard', color: 'bg-gray-100 text-gray-800' };
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des produits en vedette...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits en Vedette</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredFeaturedProducts.length} produit{filteredFeaturedProducts.length !== 1 ? 's' : ''} en vedette
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Barre de recherche */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                        
                        {/* Filtre par catégorie */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            <option value="all">Toutes les catégories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        
                        {/* Bouton d'ajout */}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[var(--company-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                        >
                            <FaPlus />
                            Ajouter un Produit
                        </button>
                    </div>
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Produits Vedettes</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <FaStar className="text-3xl text-yellow-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
                            <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.totalValue || 0)}</p>
                        </div>
                        <FaMoneyBillWave className="text-3xl text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Prix Moyen</p>
                            <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.averagePrice || 0)}</p>
                        </div>
                        <FaChartLine className="text-3xl text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Produits Disponibles</p>
                            <p className="text-2xl font-bold text-gray-800">{allProducts.length}</p>
                        </div>
                        <FaBox className="text-3xl text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Produits en vedette */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FaStar className="text-yellow-500" />
                        Produits Actuellement en Vedette
                    </h2>
                </div>

                <div className="p-6">
                    {filteredFeaturedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFeaturedProducts.map((product) => (
                                <div key={product.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Image du produit */}
                                    <div className="h-48 bg-gray-200 relative">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FaImage className="text-4xl text-gray-400" />
                                            </div>
                                        )}
                                        {/* Badge vedette */}
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <FaStar className="text-xs" />
                                                VEDETTE
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contenu */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                            {product.description}
                                        </p>
                                        
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-lg font-bold text-[var(--company-green)]">
                                                {formatPrice(product.price)}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                product.stock > 10 
                                                    ? 'bg-green-100 text-green-800'
                                                    : product.stock > 0
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {product.stock} en stock
                                            </span>
                                        </div>

                                        {/* Informations vendeur */}
                                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                            <div className="flex items-center gap-2">
                                                <FaStore className="text-gray-400" />
                                                <span>{product.seller?.name}</span>
                                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                                    getSellerBadge(product.seller?.badge).color
                                                }`}>
                                                    {getSellerBadge(product.seller?.badge).label}
                                                </span>
                                            </div>
                                            <span>{product.category?.name}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => viewProductDetails(product)}
                                                className="flex-1 bg-[var(--company-blue)] text-white py-2 px-3 rounded-lg text-sm hover:bg-[var(--app-dark-blue)] transition-colors"
                                            >
                                                Détails
                                            </button>
                                            <button
                                                onClick={() => removeFromFeatured(product.id, product.name)}
                                                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                title="Retirer des vedettes"
                                            >
                                                <FaTimesCircle />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FaStar className="mx-auto text-4xl text-gray-400 mb-3" />
                            <p className="text-gray-500 text-lg">
                                {searchTerm || categoryFilter !== 'all'
                                    ? "Aucun produit en vedette ne correspond aux critères de recherche."
                                    : "Aucun produit n'est actuellement en vedette."
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal d'ajout de produit en vedette */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Ajouter un Produit en Vedette
                                </h2>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {allProducts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    {allProducts.map((product) => (
                                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:border-[var(--company-blue)] transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="w-16 h-16 object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <FaImage className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-grow">
                                                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-[var(--company-green)] font-bold text-sm">
                                                        {formatPrice(product.price)}
                                                    </p>
                                                    <p className="text-gray-600 text-xs">
                                                        {product.seller?.name} • {product.category?.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addToFeatured(product)}
                                                className="w-full mt-3 bg-[var(--company-blue)] text-white py-2 px-3 rounded-lg text-sm hover:bg-[var(--app-dark-blue)] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FaStar />
                                                Mettre en Vedette
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FaBox className="mx-auto text-4xl text-gray-400 mb-3" />
                                    <p className="text-gray-500 text-lg">
                                        Aucun produit disponible à mettre en vedette.
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Tous les produits sont déjà en vedette ou aucun produit n'est disponible.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de détails du produit */}
            {isDetailsModalOpen && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Détails du Produit
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
                            {/* Images du produit */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Images du produit</h3>
                                <div className="flex gap-4 overflow-x-auto py-2">
                                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                        selectedProduct.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`${selectedProduct.name} ${index + 1}`}
                                                className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                                            />
                                        ))
                                    ) : (
                                        <div className="h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <FaImage className="text-3xl text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Informations générales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations du produit</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedProduct.name}</p>
                                        <p><strong>Description:</strong> {selectedProduct.description || 'Aucune description'}</p>
                                        <p><strong>Prix:</strong> {formatPrice(selectedProduct.price)}</p>
                                        <p><strong>Stock:</strong> {selectedProduct.stock} unité{selectedProduct.stock !== 1 ? 's' : ''}</p>
                                        <p><strong>Catégorie:</strong> {selectedProduct.category?.name || 'Non catégorisé'}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Informations du vendeur</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nom:</strong> {selectedProduct.seller?.name}</p>
                                        <p><strong>Téléphone:</strong> {selectedProduct.seller?.phone}</p>
                                        <p><strong>Badge:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                getSellerBadge(selectedProduct.seller?.badge).color
                                            }`}>
                                                {getSellerBadge(selectedProduct.seller?.badge).label}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Statut vedette */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <FaStar className="text-yellow-500 text-xl" />
                                    <div>
                                        <h4 className="font-semibold text-yellow-800">Produit en Vedette</h4>
                                        <p className="text-yellow-700 text-sm">
                                            Ce produit est actuellement mis en avant sur la plateforme.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => removeFromFeatured(selectedProduct.id, selectedProduct.name)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Retirer des Vedettes
                                </button>
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