// Fichier : src/app/dashboard/admin/currencies/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaMoneyBillWave,
    FaExchangeAlt,
    FaTimesCircle,
    FaCheckCircle,
    FaExclamationTriangle,
    FaChartLine
} from 'react-icons/fa';

export default function CurrenciesManagement() {
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState(null);
    const [newCurrency, setNewCurrency] = useState({
        code: '',
        name: '',
        symbol: '',
        value_in_fcfa: ''
    });

    // Charger les devises
    const fetchCurrencies = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('currencies')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            setCurrencies(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des devises:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrencies();
    }, []);

    // Filtrer les devises
    const filteredCurrencies = currencies.filter(currency => {
        return currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
               currency.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Créer une nouvelle devise
    const createCurrency = async () => {
        if (!newCurrency.code.trim() || !newCurrency.name.trim() || !newCurrency.symbol.trim() || !newCurrency.value_in_fcfa) {
            alert('Tous les champs sont obligatoires');
            return;
        }

        if (isNaN(parseFloat(newCurrency.value_in_fcfa)) || parseFloat(newCurrency.value_in_fcfa) <= 0) {
            alert('La valeur en FCFA doit être un nombre positif');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('currencies')
                .insert([{
                    code: newCurrency.code.toUpperCase(),
                    name: newCurrency.name,
                    symbol: newCurrency.symbol,
                    value_in_fcfa: parseFloat(newCurrency.value_in_fcfa)
                }])
                .select()
                .single();

            if (error) throw error;

            setCurrencies([...currencies, data]);
            setIsCreateModalOpen(false);
            setNewCurrency({ code: '', name: '', symbol: '', value_in_fcfa: '' });
        } catch (error) {
            console.error('Erreur lors de la création de la devise:', error);
            alert('Erreur lors de la création de la devise');
        }
    };

    // Mettre à jour une devise
    const updateCurrency = async () => {
        if (!editingCurrency.code.trim() || !editingCurrency.name.trim() || !editingCurrency.symbol.trim() || !editingCurrency.value_in_fcfa) {
            alert('Tous les champs sont obligatoires');
            return;
        }

        if (isNaN(parseFloat(editingCurrency.value_in_fcfa)) || parseFloat(editingCurrency.value_in_fcfa) <= 0) {
            alert('La valeur en FCFA doit être un nombre positif');
            return;
        }

        try {
            const { error } = await supabase
                .from('currencies')
                .update({
                    name: editingCurrency.name,
                    symbol: editingCurrency.symbol,
                    value_in_fcfa: parseFloat(editingCurrency.value_in_fcfa)
                })
                .eq('code', editingCurrency.code);

            if (error) throw error;

            setCurrencies(currencies.map(curr => 
                curr.code === editingCurrency.code ? { ...editingCurrency } : curr
            ));
            setIsEditModalOpen(false);
            setEditingCurrency(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la devise:', error);
            alert('Erreur lors de la mise à jour de la devise');
        }
    };

    // Supprimer une devise
    const deleteCurrency = async (currencyCode, currencyName) => {
        // Vérifier si la devise est utilisée dans d'autres tables
        const tablesToCheck = ['orders', 'payments', 'wallet_transactions', 'wallets'];
        let isUsed = false;
        let usedInTable = '';

        try {
            for (const table of tablesToCheck) {
                const { data, error } = await supabase
                    .from(table)
                    .select('id')
                    .eq('currency', currencyCode)
                    .limit(1);

                if (error) throw error;

                if (data && data.length > 0) {
                    isUsed = true;
                    usedInTable = table;
                    break;
                }
            }

            if (isUsed) {
                alert(`Impossible de supprimer cette devise car elle est utilisée dans la table "${usedInTable}".`);
                return;
            }

            if (!confirm(`Êtes-vous sûr de vouloir supprimer la devise "${currencyName}" ? Cette action est irréversible.`)) {
                return;
            }

            const { error } = await supabase
                .from('currencies')
                .delete()
                .eq('code', currencyCode);

            if (error) throw error;

            setCurrencies(currencies.filter(curr => curr.code !== currencyCode));
        } catch (error) {
            console.error('Erreur lors de la suppression de la devise:', error);
            alert('Erreur lors de la suppression de la devise');
        }
    };

    // Formater le taux de change
    const formatExchangeRate = (value) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(value);
    };

    // Réinitialiser le formulaire de création
    const resetCreateForm = () => {
        setNewCurrency({ code: '', name: '', symbol: '', value_in_fcfa: '' });
        setIsCreateModalOpen(false);
    };

    // Ouvrir le modal d'édition
    const openEditModal = (currency) => {
        setEditingCurrency({
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            value_in_fcfa: currency.value_in_fcfa.toString()
        });
        setIsEditModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des devises...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestion des Devises</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredCurrencies.length} devise{filteredCurrencies.length !== 1 ? 's' : ''} trouvée{filteredCurrencies.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Barre de recherche */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une devise..."
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
                            Nouvelle Devise
                        </button>
                    </div>
                </div>
            </div>

            {/* Tableau des devises */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nom
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Symbole
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valeur en FCFA
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
                            {filteredCurrencies.map((currency) => (
                                <tr key={currency.code} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                <FaMoneyBillWave className="text-2xl text-green-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {currency.code}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Devise
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {currency.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            {currency.symbol}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <FaExchangeAlt className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900">
                                                1 {currency.code} = {formatExchangeRate(currency.value_in_fcfa)} FCFA
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(currency.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(currency)}
                                                className="text-green-600 hover:text-green-800 transition-colors"
                                                title="Modifier la devise"
                                            >
                                                <FaEdit className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() => deleteCurrency(currency.code, currency.name)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Supprimer la devise"
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

                {filteredCurrencies.length === 0 && (
                    <div className="text-center py-12">
                        <FaMoneyBillWave className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg">
                            {searchTerm
                                ? "Aucune devise ne correspond aux critères de recherche."
                                : "Aucune devise n'a été créée pour le moment."
                            }
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-4 flex items-center gap-2 bg-[var(--company-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors mx-auto"
                            >
                                <FaPlus />
                                Créer la première devise
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de création de devise */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Nouvelle Devise
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
                                    Code de la devise *
                                </label>
                                <input
                                    type="text"
                                    value={newCurrency.code}
                                    onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value})}
                                    placeholder="Ex: USD, EUR, GBP..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] uppercase"
                                    maxLength="3"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Code ISO 3 lettres (ex: USD pour Dollar américain)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    value={newCurrency.name}
                                    onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
                                    placeholder="Ex: Dollar américain, Euro..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Symbole *
                                </label>
                                <input
                                    type="text"
                                    value={newCurrency.symbol}
                                    onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
                                    placeholder="Ex: $, €, £..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    maxLength="5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valeur en FCFA *
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={newCurrency.value_in_fcfa}
                                    onChange={(e) => setNewCurrency({...newCurrency, value_in_fcfa: e.target.value})}
                                    placeholder="Ex: 655.957 pour 1 EUR"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Combien vaut 1 unité de cette devise en FCFA
                                </p>
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
                                    onClick={createCurrency}
                                    className="px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors"
                                >
                                    Créer la devise
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition de devise */}
            {isEditModalOpen && editingCurrency && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Modifier la Devise
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
                                    Code de la devise
                                </label>
                                <input
                                    type="text"
                                    value={editingCurrency.code}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Le code de la devise ne peut pas être modifié
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    value={editingCurrency.name}
                                    onChange={(e) => setEditingCurrency({...editingCurrency, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Symbole *
                                </label>
                                <input
                                    type="text"
                                    value={editingCurrency.symbol}
                                    onChange={(e) => setEditingCurrency({...editingCurrency, symbol: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    maxLength="5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valeur en FCFA *
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={editingCurrency.value_in_fcfa}
                                    onChange={(e) => setEditingCurrency({...editingCurrency, value_in_fcfa: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Combien vaut 1 unité de cette devise en FCFA
                                </p>
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
                                    onClick={updateCurrency}
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