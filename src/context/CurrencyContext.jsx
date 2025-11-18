// Fichier : context/CurrencyContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const CurrencyContext = createContext();

// Taux de change XOF/USD en dur comme fallback si la base n'est pas chargée ou si USD n'est pas dans la liste
const USD_FALLBACK_RATE = 600; 

export function CurrencyProvider({ children }) {
    const [currencies, setCurrencies] = useState([]);
    const [defaultCurrency, setDefaultCurrency] = useState('XOF');
    const [selectedCurrency, setSelectedCurrency] = useState('XOF');
    const [loading, setLoading] = useState(true);

    // --- Fonctions de récupération des données ---

    useEffect(() => {
        const fetchCurrencyData = async () => {
            setLoading(true);
            try {
                // 1. Charger les devises
                const { data: currenciesData, error: currenciesError } = await supabase
                    .from('currencies')
                    .select('*')
                    .order('name', { ascending: true });

                if (currenciesError) throw currenciesError;
                setCurrencies(currenciesData);

                // 2. Charger la devise par défaut
                const { data: settingsData, error: settingsError } = await supabase
                    .from('platform_settings')
                    .select('value')
                    .eq('key', 'default_currency')
                    .single();

                let defaultCode = 'XOF';
                if (!settingsError && settingsData) {
                    defaultCode = settingsData.value;
                }
                
                setDefaultCurrency(defaultCode);
                setSelectedCurrency(defaultCode);

            } catch (error) {
                //console.error("Erreur lors du chargement des données de devise:", error);
                // Utiliser des valeurs par défaut en cas d'erreur
                setCurrencies([{ code: 'XOF', name: 'Franc CFA', symbol: 'FCFA', value_in_fcfa: 1 }]);
                setDefaultCurrency('XOF');
                setSelectedCurrency('XOF');
            } finally {
                setLoading(false);
            }
        };

        fetchCurrencyData();
    }, []);

    // --- Fonctions utilitaires ---

    /**
     * @description Obtient l'objet devise pour un code donné ou la devise sélectionnée.
     * @param {string} [currencyCode=selectedCurrency] - Code de devise (ex: 'USD', 'EUR').
     * @returns {{ code: string, symbol: string, value_in_fcfa: number }}
     */
    const getSelectedCurrency = (currencyCode = selectedCurrency) => {
        // Tente de trouver la devise dans la liste chargée
        const currency = currencies.find(c => c.code === currencyCode);
        
        if (currency) {
            return currency;
        }

        // Fallback pour USD ou la devise par défaut si elle n'est pas trouvée
        if (currencyCode === 'USD') {
            return { code: 'USD', name: 'Dollar US', symbol: '$', value_in_fcfa: USD_FALLBACK_RATE };
        }
        
        // Fallback général (devise de base XOF)
        return { code: 'XOF', name: 'Franc CFA', symbol: 'FCFA', value_in_fcfa: 1 };
    };

    /**
     * @description Obtient le taux de change (XOF / Devise) pour un code donné ou la devise sélectionnée.
     * @param {string} [currencyCode=selectedCurrency] - Code de devise.
     * @returns {number} Le taux de conversion (1 XOF = Taux * CodeDevise)
     */
    const getExchangeRate = (currencyCode = selectedCurrency) => {
        const currency = getSelectedCurrency(currencyCode);
        // value_in_fcfa est le montant de XOF pour 1 unité de la devise (XOF/Devise)
        return currency.value_in_fcfa; 
    };

    /**
     * @description Formate un prix en le convertissant de XOF à la devise spécifiée.
     * @param {number} amount - Montant de base supposé être en XOF.
     * @param {string} [currencyCode=selectedCurrency] - Code de devise cible.
     * @returns {string} Le prix formaté.
     */
    const formatPrice = (amount, currencyCode = selectedCurrency) => {
        const currency = getSelectedCurrency(currencyCode);
        const exchangeRate = currency.value_in_fcfa;

        // Montant converti dans la devise cible (Montant XOF / Taux XOF/Devise)
        const convertedAmount = amount / exchangeRate;

        // Gérer l'affichage des décimales
        const decimalPlaces = convertedAmount % 1 === 0 ? 0 : 2;

        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: decimalPlaces
        }).format(convertedAmount);
    };

    const value = {
        currencies,
        defaultCurrency,
        selectedCurrency,
        setSelectedCurrency,
        formatPrice,
        getExchangeRate,
        getSelectedCurrency, // Exporté pour l'utiliser pour la conversion PayPal
        loading
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency doit être utilisé à l\'intérieur d\'un CurrencyProvider');
    }
    return context;
}