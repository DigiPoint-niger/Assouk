// Fichier : src/app/dashboard/admin/categories/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaTag,
    FaFolder,
    FaFolderOpen,
    FaTimesCircle,
    FaCheckCircle,
    FaExclamationTriangle
} from 'react-icons/fa';

export default function CategoriesManagement() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        parent_id: null
    });

    // Charger les catégories avec leurs relations parentales
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select(`
                    *,
                    parent:categories!parent_id(name),
                    children:categories!parent_id(count)
                `)
                .order('name', { ascending: true });

            if (error) throw error;

            // Formater les données pour inclure le nombre d'enfants
            const formattedCategories = (data || []).map(category => ({
                ...category,
                childrenCount: category.children?.length || 0
            }));

            setCategories(formattedCategories);
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Filtrer les catégories
    const filteredCategories = categories.filter(category => {
        return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Créer une nouvelle catégorie
    const createCategory = async () => {
        if (!newCategory.name.trim()) {
            alert('Le nom de la catégorie est obligatoire');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([{
                    name: newCategory.name,
                    description: newCategory.description,
                    parent_id: newCategory.parent_id || null
                }])
                .select()
                .single();

            if (error) throw error;

            setCategories([...categories, { ...data, childrenCount: 0 }]);
            setIsCreateModalOpen(false);
            setNewCategory({ name: '', description: '', parent_id: null });
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);
            alert('Erreur lors de la création de la catégorie');
        }
    };

    // Mettre à jour une catégorie
    const updateCategory = async () => {
        if (!editingCategory.name.trim()) {
            alert('Le nom de la catégorie est obligatoire');
            return;
        }

        try {
            const { error } = await supabase
                .from('categories')
                .update({
                    name: editingCategory.name,
                    description: editingCategory.description,
                    parent_id: editingCategory.parent_id || null
                })
                .eq('id', editingCategory.id);

            if (error) throw error;

            setCategories(categories.map(cat => 
                cat.id === editingCategory.id ? { ...editingCategory, childrenCount: cat.childrenCount } : cat
            ));
            setIsEditModalOpen(false);
            setEditingCategory(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la catégorie:', error);
            alert('Erreur lors de la mise à jour de la catégorie');
        }
    };

    // Supprimer une catégorie
    const deleteCategory = async (categoryId, categoryName, hasChildren) => {
        if (hasChildren) {
            alert('Impossible de supprimer cette catégorie car elle contient des sous-catégories. Veuillez d\'abord supprimer ou déplacer les sous-catégories.');
            return;
        }

        if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            // Vérifier si la catégorie est utilisée par des produits
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id')
                .eq('category_id', categoryId)
                .limit(1);

            if (productsError) throw productsError;

            if (products && products.length > 0) {
                alert('Impossible de supprimer cette catégorie car elle est utilisée par des produits. Veuillez d\'abord modifier ou supprimer les produits associés.');
                return;
            }

            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;

            setCategories(categories.filter(cat => cat.id !== categoryId));
        } catch (error) {
            console.error('Erreur lors de la suppression de la catégorie:', error);
            alert('Erreur lors de la suppression de la catégorie');
        }
    };

    // Obtenir le nom du parent
    const getParentName = (parentId) => {
        if (!parentId) return 'Aucun';
        const parent = categories.find(cat => cat.id === parentId);
        return parent ? parent.name : 'Inconnu';
    };

    // Obtenir les catégories disponibles comme parents (exclure la catégorie courante en édition)
    const getAvailableParents = (currentCategoryId = null) => {
        return categories.filter(cat => cat.id !== currentCategoryId);
    };

    // Réinitialiser le formulaire de création
    const resetCreateForm = () => {
        setNewCategory({ name: '', description: '', parent_id: null });
        setIsCreateModalOpen(false);
    };

    // Ouvrir le modal d'édition
    const openEditModal = (category) => {
        setEditingCategory({
            id: category.id,
            name: category.name,
            description: category.description || '',
            parent_id: category.parent_id
        });
        setIsEditModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des catégories...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Catégories</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredCategories.length} catégorie{filteredCategories.length !== 1 ? 's' : ''} trouvée{filteredCategories.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Barre de recherche */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une catégorie..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                        
                        {/* Bouton d'ajout */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-[var(--company-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                        >
                            <FaPlus />
                            Nouvelle Catégorie
                        </button>
                    </div>
                </div>
            </div>

            {/* Tableau des catégories */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Catégorie
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Parent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sous-catégories
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
                            {filteredCategories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                {category.childrenCount > 0 ? (
                                                    <FaFolderOpen className="text-2xl text-[var(--company-blue)]" />
                                                ) : (
                                                    <FaFolder className="text-2xl text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {category.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {category.id.slice(-8)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                            {category.description || 'Aucune description'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {getParentName(category.parent_id)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            category.childrenCount > 0
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {category.childrenCount > 0 ? (
                                                <FaFolderOpen className="text-xs" />
                                            ) : (
                                                <FaFolder className="text-xs" />
                                            )}
                                            {category.childrenCount} sous-catégorie{category.childrenCount !== 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(category.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(category)}
                                                className="text-green-600 hover:text-green-800 transition-colors"
                                                title="Modifier la catégorie"
                                            >
                                                <FaEdit className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() => deleteCategory(category.id, category.name, category.childrenCount > 0)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Supprimer la catégorie"
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

                {filteredCategories.length === 0 && (
                    <div className="text-center py-12">
                        <FaTag className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm
                                ? "Aucune catégorie ne correspond aux critères de recherche."
                                : "Aucune catégorie n'a été créée pour le moment."
                            }
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-4 flex items-center gap-2 bg-[var(--company-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors mx-auto"
                            >
                                <FaPlus />
                                Créer la première catégorie
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de création de catégorie */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Nouvelle Catégorie
                                </h2>
                                <button
                                    onClick={resetCreateForm}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom de la catégorie *
                                </label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                    placeholder="Ex: Électronique, Vêtements..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                                    placeholder="Description de la catégorie..."
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catégorie parente
                                </label>
                                <select
                                    value={newCategory.parent_id || ''}
                                    onChange={(e) => setNewCategory({...newCategory, parent_id: e.target.value || null})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                >
                                    <option value="">Aucune (catégorie racine)</option>
                                    {getAvailableParents().map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={resetCreateForm}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={createCategory}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Créer la catégorie
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition de catégorie */}
            {isEditModalOpen && editingCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Modifier la Catégorie
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
                                    Nom de la catégorie *
                                </label>
                                <input
                                    type="text"
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editingCategory.description}
                                    onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catégorie parente
                                </label>
                                <select
                                    value={editingCategory.parent_id || ''}
                                    onChange={(e) => setEditingCategory({...editingCategory, parent_id: e.target.value || null})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                >
                                    <option value="">Aucune (catégorie racine)</option>
                                    {getAvailableParents(editingCategory.id).map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
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
                                    onClick={updateCategory}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Enregistrer les modifications
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}