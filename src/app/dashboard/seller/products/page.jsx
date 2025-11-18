// Fichier : src/app/dashboard/seller/products/page.jsx

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

export default function SellerProductsManagement() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category_id: '',
        images: []
    });
    const [uploadingImages, setUploadingImages] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Récupérer l'utilisateur connecté
    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getCurrentUser();
    }, []);

    // Charger les produits du vendeur connecté
    const fetchProducts = async () => {
        if (!currentUser) return;
        
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    category:categories(name)
                `)
                .eq('seller_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
        } finally {
            setLoading(false);
        }
    };

    // Charger les catégories pour le filtre et la création
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
        if (currentUser) {
            fetchProducts();
            fetchCategories();
        }
    }, [currentUser]);

    // Filtrer les produits
    const filteredProducts = products.filter(product => {
        const matchesSearch = 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
        
        const matchesStock = stockFilter === 'all' || 
            (stockFilter === 'in_stock' && product.stock > 0) ||
            (stockFilter === 'out_of_stock' && product.stock === 0);
        
        return matchesSearch && matchesCategory && matchesStock;
    });

    // Gérer l'upload des images
    const handleImageUpload = async (files, productId = null) => {
        setUploadingImages(true);
        try {
            const uploadedUrls = [];
            
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('Certaines images sont trop volumineuses (max 5MB)');
                    continue;
                }

                if (!file.type.startsWith('image/')) {
                    alert('Veuillez sélectionner uniquement des images');
                    continue;
                }

                // Utiliser un ID temporaire pour les nouveaux produits
                const tempProductId = productId || 'temp';
                const url = await uploadProductImage(file, tempProductId);
                uploadedUrls.push(url);
            }

            return uploadedUrls;
            
        } catch (error) {
            console.error('Erreur lors de l\'upload des images:', error);
            alert('Erreur lors de l\'upload des images');
            return [];
        } finally {
            setUploadingImages(false);
        }
    };

    // Upload d'images pour l'édition
    const handleEditImageUpload = async (files) => {
        const uploadedUrls = await handleImageUpload(files, editingProduct?.id);
        if (uploadedUrls.length > 0) {
            const updatedImages = [...(editingProduct.images || []), ...uploadedUrls];
            setEditingProduct({...editingProduct, images: updatedImages});
        }
    };

    // Upload d'images pour la création
    const handleCreateImageUpload = async (files) => {
        const uploadedUrls = await handleImageUpload(files);
        if (uploadedUrls.length > 0) {
            setNewProduct({...newProduct, images: [...newProduct.images, ...uploadedUrls]});
        }
    };

    // Supprimer une image en édition
    const removeEditImage = (indexToRemove) => {
        const updatedImages = editingProduct.images.filter((_, index) => index !== indexToRemove);
        setEditingProduct({...editingProduct, images: updatedImages});
    };

    // Supprimer une image en création
    const removeCreateImage = (indexToRemove) => {
        const updatedImages = newProduct.images.filter((_, index) => index !== indexToRemove);
        setNewProduct({...newProduct, images: updatedImages});
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

    // Ouvrir le modal de création
    const openCreateModal = () => {
        setNewProduct({
            name: '',
            description: '',
            price: 0,
            stock: 0,
            category_id: '',
            images: []
        });
        setIsCreateModalOpen(true);
    };

    // Mettre à jour un produit
    const updateProduct = async (updatedData) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    ...updatedData,
                    images: editingProduct.images
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

    // Créer un nouveau produit
    const createProduct = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert({
                    ...newProduct,
                    seller_id: currentUser.id
                })
                .select()
                .single();

            if (error) throw error;

            // Si le produit a été créé avec succès, mettre à jour les URLs des images avec le vrai productId
            if (data && newProduct.images.length > 0) {
                // Ici vous devriez mettre à jour les images avec le vrai productId
                // Cette partie nécessiterait une logique supplémentaire pour re-uploader les images avec le bon ID
                // Pour simplifier, nous allons juste ajouter le produit avec les images temporaires
            }

            // Ajouter le nouveau produit à la liste
            setProducts([data, ...products]);
            setIsCreateModalOpen(false);
            setNewProduct({
                name: '',
                description: '',
                price: 0,
                stock: 0,
                category_id: '',
                images: []
            });

        } catch (error) {
            console.error('Erreur lors de la création du produit:', error);
        }
    };

    // Formater le prix
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(price);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement de vos produits...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Mes Produits</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Barre de recherche et filtres */}
                        <div className="flex flex-col sm:flex-row gap-3">
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
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                            >
                                <option value="all">Tous les stocks</option>
                                <option value="in_stock">En stock</option>
                                <option value="out_of_stock">Rupture</option>
                            </select>
                        </div>

                        {/* Bouton d'ajout */}
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors flex items-center gap-2"
                        >
                            <FaPlus />
                            Ajouter un produit
                        </button>
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
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                            product.is_featured
                                                ? 'bg-[var(--company-blue)] text-white'
                                                : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {product.is_featured ? <FaStar /> : <FaStar className="text-gray-400" />}
                                            {product.is_featured ? 'En vedette' : 'Standard'}
                                        </span>
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
                            {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                                ? "Aucun produit ne correspond aux critères de recherche."
                                : "Vous n'avez pas encore de produits."
                            }
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="mt-4 px-6 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors flex items-center gap-2 mx-auto"
                        >
                            <FaPlus />
                            Ajouter votre premier produit
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de détails du produit (identique à la version admin) */}
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
                                                onClick={() => removeEditImage(index)}
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
                                        onChange={(e) => handleEditImageUpload(Array.from(e.target.files))}
                                        className="hidden"
                                        id="edit-image-upload"
                                        disabled={uploadingImages}
                                    />
                                    <label
                                        htmlFor="edit-image-upload"
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
                                                    Cliquez pour ajouter des images
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
                                        category_id: editingProduct.category_id
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

            {/* Modal de création du produit */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Ajouter un nouveau produit
                                </h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
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
                                
                                {/* Affichage des images sélectionnées */}
                                <div className="flex flex-wrap gap-3 mb-4">
                                    {newProduct.images && newProduct.images.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={image}
                                                alt={`Produit ${index + 1}`}
                                                className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeCreateImage(index)}
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
                                        onChange={(e) => handleCreateImageUpload(Array.from(e.target.files))}
                                        className="hidden"
                                        id="create-image-upload"
                                        disabled={uploadingImages}
                                    />
                                    <label
                                        htmlFor="create-image-upload"
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
                                                    Cliquez pour ajouter des images
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
                                        Nom du produit *
                                    </label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                        placeholder="Nom du produit"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                        placeholder="Description du produit"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Prix (FCFA) *
                                        </label>
                                        <input
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stock *
                                        </label>
                                        <input
                                            type="number"
                                            value={newProduct.stock}
                                            onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Catégorie
                                    </label>
                                    <select
                                        value={newProduct.category_id}
                                        onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
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
                                    onClick={createProduct}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                    disabled={!newProduct.name || !newProduct.price || uploadingImages}
                                >
                                    {uploadingImages ? (
                                        <div className="flex items-center gap-2">
                                            <FaSpinner className="animate-spin" />
                                            Création...
                                        </div>
                                    ) : (
                                        'Créer le produit'
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