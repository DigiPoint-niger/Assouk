// Fichier : src/app/dashboard/admin/products/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadProductImage, deleteProductImages } from '@/lib/storage';
import {
    FaSearch,
    FaFilter,
    FaEye,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaBox,
    FaStar,
    FaTimesCircle,
    FaCheckCircle,
    FaPlus,
    FaImage,
    FaStore,
    FaUpload,
    FaTimes
} from 'react-icons/fa';

export default function ProductsManagement() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [featuredFilter, setFeaturedFilter] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Charger les produits avec les informations du vendeur et de la catégorie
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    seller:profiles!seller_id(name, phone, badge),
                    category:categories(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
        } finally {
            setLoading(false);
        }
    };

    // Charger les catégories pour le filtre
    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Filtrer les produits
    const filteredProducts = products.filter(product => {
        const matchesSearch = 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
        
        const matchesFeatured = featuredFilter === 'all' || 
            (featuredFilter === 'featured' && product.is_featured) ||
            (featuredFilter === 'not_featured' && !product.is_featured);
        
        return matchesSearch && matchesCategory && matchesFeatured;
    });

    // Mettre à jour le statut "en vedette"
    const toggleFeatured = async (productId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_featured: !currentStatus })
                .eq('id', productId);

            if (error) throw error;

            setProducts(products.map(product => 
                product.id === productId ? { ...product, is_featured: !currentStatus } : product
            ));
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
        }
    };

    // Gérer l'upload des images
    const handleImageUpload = async (files) => {
        setUploadingImages(true);
        try {
            const uploadedUrls = [];
            
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    alert('Certaines images sont trop volumineuses (max 5MB)');
                    continue;
                }

                if (!file.type.startsWith('image/')) {
                    alert('Veuillez sélectionner uniquement des images');
                    continue;
                }

                const url = await uploadProductImage(file, editingProduct.id);
                uploadedUrls.push(url);
            }

            // Fusionner les nouvelles images avec les existantes
            const updatedImages = [...(editingProduct.images || []), ...uploadedUrls];
            setEditingProduct({...editingProduct, images: updatedImages});
            
        } catch (error) {
            console.error('Erreur lors de l\'upload des images:', error);
            alert('Erreur lors de l\'upload des images');
        } finally {
            setUploadingImages(false);
        }
    };

    // Supprimer une image
    const removeImage = (indexToRemove) => {
        const updatedImages = editingProduct.images.filter((_, index) => index !== indexToRemove);
        setEditingProduct({...editingProduct, images: updatedImages});
    };

    // Supprimer un produit avec ses images
    const deleteProduct = async (productId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) {
            return;
        }

        try {
            const product = products.find(p => p.id === productId);
            
            // Supprimer les images du storage
            if (product.images && product.images.length > 0) {
                await deleteProductImages(productId, product.images);
            }

            // Supprimer le produit de la base de données
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            setProducts(products.filter(product => product.id !== productId));
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    // Afficher les détails d'un produit
    const viewProductDetails = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // Ouvrir le modal d'édition
    const openEditModal = (product) => {
        setEditingProduct(product);
        setIsEditModalOpen(true);
    };

    // Mettre à jour un produit
    const updateProduct = async (updatedData) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    ...updatedData,
                    images: editingProduct.images // Inclure les images mises à jour
                })
                .eq('id', editingProduct.id);

            if (error) throw error;

            // Mettre à jour l'état local
            setProducts(products.map(product => 
                product.id === editingProduct.id ? { ...product, ...updatedData, images: editingProduct.images } : product
            ));

            setIsEditModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du produit:', error);
        }
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
                <span className="text-lg">Chargement des produits...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    {/* Barre de recherche et filtres */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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

                        <select
                            value={featuredFilter}
                            onChange={(e) => setFeaturedFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            <option value="all">Tous les produits</option>
                            <option value="featured">En vedette</option>
                            <option value="not_featured">Non vedette</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tableau des produits */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Produit
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendeur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Catégorie
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prix
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vedette
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                                {product.images && product.images.length > 0 ? (
                                                    <img
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        className="h-10 w-10 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <FaImage className="text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                                    {product.name}
                                                </div>
                                                <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                                                    {product.description}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{product.seller?.name}</div>
                                        <div className="text-xs text-gray-500">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                                                getSellerBadge(product.seller?.badge).color
                                            }`}>
                                                {getSellerBadge(product.seller?.badge).label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {product.category?.name || 'Non catégorisé'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {formatPrice(product.price)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            product.stock > 10 
                                                ? 'bg-green-100 text-green-800'
                                                : product.stock > 0
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {product.stock} unité{product.stock !== 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => toggleFeatured(product.id, product.is_featured)}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                product.is_featured
                                                    ? 'bg-[var(--company-blue)] text-white hover:bg-[var(--app-dark-blue)]'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {product.is_featured ? <FaStar /> : <FaStar className="text-gray-400" />}
                                            {product.is_featured ? 'En vedette' : 'Mettre en vedette'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(product.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => viewProductDetails(product)}
                                                className="text-[var(--company-blue)] hover:text-[var(--app-dark-blue)] transition-colors"
                                                title="Voir les détails"
                                            >
                                                <FaEye className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="text-green-600 hover:text-green-800 transition-colors"
                                                title="Modifier le produit"
                                            >
                                                <FaEdit className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Supprimer le produit"
                                            >
                                                <FaTrash className="text-lg" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <FaBox className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm || categoryFilter !== 'all' || featuredFilter !== 'all'
                                ? "Aucun produit ne correspond aux critères de recherche."
                                : "Aucun produit n'a été créé pour le moment."
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de détails du produit */}
            {isModalOpen && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Détails du produit
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
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

                            {/* Statuts et métadonnées */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Statut</h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <strong>En vedette:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                                selectedProduct.is_featured 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {selectedProduct.is_featured ? 'Oui' : 'Non'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Métadonnées</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Date de création:</strong> {new Date(selectedProduct.created_at).toLocaleDateString('fr-FR')}</p>
                                        <p><strong>ID du produit:</strong> {selectedProduct.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition du produit */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Modifier le produit
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingProduct(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Section Images */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Images du produit
                                </label>
                                
                                {/* Affichage des images existantes */}
                                <div className="flex flex-wrap gap-3 mb-4">
                                    {editingProduct.images && editingProduct.images.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={image}
                                                alt={`Produit ${index + 1}`}
                                                className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <FaTimes className="text-xs" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Upload de nouvelles images */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                                        className="hidden"
                                        id="image-upload"
                                        disabled={uploadingImages}
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${
                                            uploadingImages ? 'opacity-50' : 'hover:bg-gray-50'
                                        } transition-colors p-4 rounded-lg`}
                                    >
                                        {uploadingImages ? (
                                            <>
                                                <FaSpinner className="animate-spin text-[var(--company-blue)] text-xl" />
                                                <span className="text-sm text-gray-600">Upload en cours...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaUpload className="text-[var(--company-blue)] text-xl" />
                                                <span className="text-sm text-gray-600">
                                                    Cliquez pour ajouter des images ou glissez-déposez
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Formats supportés: JPG, PNG, WEBP (max. 5MB par image)
                                                </span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom du produit
                                    </label>
                                    <input
                                        type="text"
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={editingProduct.description || ''}
                                        onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Prix (FCFA)
                                        </label>
                                        <input
                                            type="number"
                                            value={editingProduct.price}
                                            onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stock
                                        </label>
                                        <input
                                            type="number"
                                            value={editingProduct.stock}
                                            onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Catégorie
                                    </label>
                                    <select
                                        value={editingProduct.category_id || ''}
                                        onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    >
                                        <option value="">Sélectionner une catégorie</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        checked={editingProduct.is_featured}
                                        onChange={(e) => setEditingProduct({...editingProduct, is_featured: e.target.checked})}
                                        className="rounded border-gray-300 text-[var(--company-blue)] focus:ring-[var(--company-blue)]"
                                    />
                                    <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
                                        Mettre en vedette
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingProduct(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => updateProduct({
                                        name: editingProduct.name,
                                        description: editingProduct.description,
                                        price: editingProduct.price,
                                        stock: editingProduct.stock,
                                        category_id: editingProduct.category_id,
                                        is_featured: editingProduct.is_featured
                                    })}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                    disabled={uploadingImages}
                                >
                                    {uploadingImages ? (
                                        <div className="flex items-center gap-2">
                                            <FaSpinner className="animate-spin" />
                                            Enregistrement...
                                        </div>
                                    ) : (
                                        'Enregistrer les modifications'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}