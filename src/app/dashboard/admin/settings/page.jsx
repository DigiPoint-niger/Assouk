// Fichier : src/app/dashboard/admin/settings/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FaSpinner,
    FaSave,
    FaCog,
    FaStore,
    FaUserPlus,
    FaUser,
    FaTruck,
    FaShoppingCart,
    FaMoneyBillWave,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle
} from 'react-icons/fa';

export default function PlatformSettings() {
    const [settings, setSettings] = useState({
        platform_enabled: true,
        seller_registration_enabled: true,
        deliverer_registration_enabled: true,
        client_registration_enabled: true,
        default_currency: 'XOF',
        shipping_fee: 2000
    });
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Charger les paramètres et les devises
    const fetchData = async () => {
        setLoading(true);
        try {
            // Charger les paramètres de la plateforme
            const { data: settingsData, error: settingsError } = await supabase
                .from('platform_settings')
                .select('*');

            if (settingsError) throw settingsError;

            // Convertir les paramètres en objet
            const settingsObj = {};
            if (settingsData) {
                settingsData.forEach(setting => {
                    // Convertir les valeurs string 'true'/'false' en boolean
                    if (setting.value === 'true' || setting.value === 'false') {
                        settingsObj[setting.key] = setting.value === 'true';
                    } else {
                        settingsObj[setting.key] = setting.value;
                    }
                });
            }

            // Charger les devises disponibles
            const { data: currenciesData, error: currenciesError } = await supabase
                .from('currencies')
                .select('code, name, symbol')
                .order('name', { ascending: true });

            if (currenciesError) throw currenciesError;

            setSettings(settingsObj);
            setCurrencies(currenciesData || []);
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            setMessage({
                type: 'error',
                text: 'Erreur lors du chargement des paramètres'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Sauvegarder les paramètres
    const saveSettings = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Préparer les données pour l'insertion
            const settingsToSave = Object.entries(settings).map(([key, value]) => ({
                key,
                value: value.toString() // Convertir en string pour la base de données
            }));

            // Utiliser upsert pour mettre à jour ou créer les paramètres
            const { error } = await supabase
                .from('platform_settings')
                .upsert(settingsToSave, {
                    onConflict: 'key'
                });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Paramètres sauvegardés avec succès!'
            });
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            setMessage({
                type: 'error',
                text: 'Erreur lors de la sauvegarde des paramètres'
            });
        } finally {
            setSaving(false);
        }
    };

    // Gérer le changement des paramètres
    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Toggle pour les paramètres boolean
    const ToggleSwitch = ({ enabled, onChange, label, description }) => (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                    {label}
                </label>
                <p className="text-sm text-gray-500 mt-1">
                    {description}
                </p>
            </div>
            <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:ring-offset-2 ${
                    enabled ? 'bg-[var(--company-green)]' : 'bg-gray-200'
                }`}
                onClick={() => onChange(!enabled)}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-3xl text-[var(--company-blue)] mr-3" />
                <span className="text-lg">Chargement des paramètres...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                    <FaCog className="text-2xl text-[var(--company-blue)]" />
                    <h1 className="text-2xl font-bold text-gray-800">Paramètres de la Plateforme</h1>
                </div>
                <p className="text-gray-600">
                    Configurez les paramètres généraux de votre plateforme ASSOUK
                </p>
            </div>

            {/* Message de statut */}
            {message.text && (
                <div className={`rounded-lg p-4 ${
                    message.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'success' ? (
                            <FaCheckCircle className="text-green-500" />
                        ) : (
                            <FaExclamationTriangle className="text-red-500" />
                        )}
                        <span className="font-medium">{message.text}</span>
                    </div>
                </div>
            )}

            {/* Section État de la Plateforme */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <FaStore className="text-xl text-[var(--company-blue)]" />
                        <h2 className="text-lg font-semibold text-gray-800">État de la Plateforme</h2>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <ToggleSwitch
                        enabled={settings.platform_enabled}
                        onChange={(value) => handleSettingChange('platform_enabled', value)}
                        label="Plateforme active"
                        description="Activez ou désactivez l'accès à toute la plateforme. En mode désactivé, les utilisateurs verront une page de maintenance."
                    />

                    {!settings.platform_enabled && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-yellow-800">
                                <FaExclamationTriangle />
                                <span className="font-medium">Mode maintenance activé</span>
                            </div>
                            <p className="text-yellow-700 text-sm mt-1">
                                La plateforme est actuellement en mode maintenance. Seuls les administrateurs peuvent y accéder.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section Inscriptions */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <FaUserPlus className="text-xl text-[var(--company-blue)]" />
                        <h2 className="text-lg font-semibold text-gray-800">Gestion des Inscriptions</h2>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <ToggleSwitch
                        enabled={settings.client_registration_enabled}
                        onChange={(value) => handleSettingChange('client_registration_enabled', value)}
                        label="Inscriptions clients"
                        description="Autorise les nouveaux utilisateurs à créer un compte client"
                    />

                    <ToggleSwitch
                        enabled={settings.seller_registration_enabled}
                        onChange={(value) => handleSettingChange('seller_registration_enabled', value)}
                        label="Inscriptions vendeurs"
                        description="Autorise les nouveaux utilisateurs à créer un compte vendeur"
                    />

                    <ToggleSwitch
                        enabled={settings.deliverer_registration_enabled}
                        onChange={(value) => handleSettingChange('deliverer_registration_enabled', value)}
                        label="Inscriptions livreurs"
                        description="Autorise les nouveaux utilisateurs à créer un compte livreur"
                    />

                    {/* Résumé des inscriptions actives */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className={`border rounded-lg p-4 text-center ${
                            settings.client_registration_enabled 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-red-200 bg-red-50'
                        }`}>
                            <FaUser className={`mx-auto text-xl ${
                                settings.client_registration_enabled ? 'text-green-600' : 'text-red-600'
                            }`} />
                            <h3 className="font-semibold mt-2">Clients</h3>
                            <span className={`text-sm ${
                                settings.client_registration_enabled ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {settings.client_registration_enabled ? 'Inscriptions activées' : 'Inscriptions désactivées'}
                            </span>
                        </div>

                        <div className={`border rounded-lg p-4 text-center ${
                            settings.seller_registration_enabled 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-red-200 bg-red-50'
                        }`}>
                            <FaStore className={`mx-auto text-xl ${
                                settings.seller_registration_enabled ? 'text-green-600' : 'text-red-600'
                            }`} />
                            <h3 className="font-semibold mt-2">Vendeurs</h3>
                            <span className={`text-sm ${
                                settings.seller_registration_enabled ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {settings.seller_registration_enabled ? 'Inscriptions activées' : 'Inscriptions désactivées'}
                            </span>
                        </div>

                        <div className={`border rounded-lg p-4 text-center ${
                            settings.deliverer_registration_enabled 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-red-200 bg-red-50'
                        }`}>
                            <FaTruck className={`mx-auto text-xl ${
                                settings.deliverer_registration_enabled ? 'text-green-600' : 'text-red-600'
                            }`} />
                            <h3 className="font-semibold mt-2">Livreurs</h3>
                            <span className={`text-sm ${
                                settings.deliverer_registration_enabled ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {settings.deliverer_registration_enabled ? 'Inscriptions activées' : 'Inscriptions désactivées'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Configuration Financière */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <FaMoneyBillWave className="text-xl text-[var(--company-blue)]" />
                        <h2 className="text-lg font-semibold text-gray-800">Configuration Financière</h2>
                    </div>
                </div>
                <div className="p-6">
                    <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Devise par défaut
                        </label>
                        <select
                            value={settings.default_currency}
                            onChange={(e) => handleSettingChange('default_currency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        >
                            {currencies.map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.name} ({currency.symbol}) - {currency.code}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-1">
                            Cette devise sera utilisée par défaut pour tous les prix et transactions sur la plateforme.
                        </p>
                    </div>

                    {/* Frais de livraison */}
                    <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frais de livraison (en {settings.default_currency})
                        </label>
                        <input
                            type="number"
                            value={settings.shipping_fee}
                            onChange={(e) => handleSettingChange('shipping_fee', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)] focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Ces frais seront ajoutés au total de chaque commande.
                        </p>
                    </div>

                    {/* Aperçu de la devise sélectionnée */}
                    {settings.default_currency && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                            <h4 className="font-medium text-gray-800 mb-2">Aperçu de la devise</h4>
                            <div className="flex items-center gap-3">
                                <FaMoneyBillWave className="text-2xl text-green-500" />
                                <div>
                                    <p className="font-semibold">
                                        {currencies.find(c => c.code === settings.default_currency)?.name || 'Devise'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Symbole: {currencies.find(c => c.code === settings.default_currency)?.symbol}
                                        {' | '}
                                        Code: {settings.default_currency}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Section Résumé des Paramètres */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">Résumé des Paramètres</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-800">Statut de la Plateforme</h3>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                    settings.platform_enabled ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                <span>{settings.platform_enabled ? 'Plateforme active' : 'Plateforme en maintenance'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-800">Inscriptions Actives</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FaUser className="text-gray-400" />
                                    <span>Clients: {settings.client_registration_enabled ? '✅' : '❌'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaStore className="text-gray-400" />
                                    <span>Vendeurs: {settings.seller_registration_enabled ? '✅' : '❌'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaTruck className="text-gray-400" />
                                    <span>Livreurs: {settings.deliverer_registration_enabled ? '✅' : '❌'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-medium text-gray-800 mb-2">Devise par Défaut</h3>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <FaMoneyBillWave className="text-2xl text-green-500" />
                            <div>
                                <p className="font-semibold">
                                    {currencies.find(c => c.code === settings.default_currency)?.name || 'Non définie'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Code: {settings.default_currency} | 
                                    Symbole: {currencies.find(c => c.code === settings.default_currency)?.symbol}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Boutons d'action */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        onClick={fetchData}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <FaSpinner className="animate-spin" />
                        ) : (
                            <FaSave />
                        )}
                        {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                    </button>
                </div>
            </div>

            {/* Avertissement important */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-yellow-500 text-xl mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-800 mb-2">Informations importantes</h3>
                        <ul className="text-yellow-700 text-sm space-y-1">
                            <li>• La désactivation de la plateforme mettra tous les utilisateurs en mode maintenance</li>
                            <li>• Les inscriptions désactivées empêcheront la création de nouveaux comptes</li>
                            <li>• La devise par défaut affectera l'affichage de tous les prix</li>
                            <li>• Les modifications sont appliquées immédiatement après sauvegarde</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}