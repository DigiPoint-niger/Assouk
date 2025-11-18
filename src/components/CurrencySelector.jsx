// Fichier : components/CurrencySelector.jsx
"use client";

import { useCurrency } from '@/context/CurrencyContext';
import { FaExchangeAlt, FaSpinner } from 'react-icons/fa';

export default function CurrencySelector() {
    const { currencies, selectedCurrency, setSelectedCurrency, loading } = useCurrency();

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                <FaSpinner className="animate-spin" />
                <span>Devises...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <FaExchangeAlt className="text-gray-400" />
            <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm cursor-pointer"
                title="Changer la devise"
            >
                {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol})
                    </option>
                ))}
            </select>
        </div>
    );
}