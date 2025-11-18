/**
 * Configuration des Paiements - ASSOUK
 * Centralise les constantes, règles et configuration pour tous les types de paiement
 */

export const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: 'cash_on_delivery',
  TRANSFER_AMANA: 'transfer_amana',
  TRANSFER_NITA: 'transfer_nita',
  PAYPAL: 'paypal'
};

export const PAYMENT_METHOD_NAMES = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: 'Paiement à la Livraison',
  [PAYMENT_METHODS.TRANSFER_AMANA]: 'Transfert Amana',
  [PAYMENT_METHODS.TRANSFER_NITA]: 'Transfert Nita',
  [PAYMENT_METHODS.PAYPAL]: 'PayPal'
};

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PENDING_CONFIRMATION: 'pending_confirmation',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELED: 'canceled'
};

/**
 * Règles de paiement par méthode
 * Contient les limites, devises acceptées, délais de confirmation, etc.
 */
export const PAYMENT_RULES = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: {
    name: 'Paiement à la Livraison',
    acceptedCurrencies: ['XOF'], // Seulement XOF
    minAmount: 1000, // 1000 XOF minimum
    maxAmount: 10000000, // 10M XOF maximum
    requiresVerification: false, // Pas de vérification supplémentaire
    requiresTransaction: false,
    description: 'Payer en espèces à la réception de la commande',
    icon: 'FaMoneyBillWave'
  },
  [PAYMENT_METHODS.TRANSFER_AMANA]: {
    name: 'Transfert Amana',
    acceptedCurrencies: ['XOF'],
    minAmount: 1000,
    maxAmount: 5000000,
    requiresVerification: true, // Nécessite un code de transaction
    requiresTransaction: true, // Nécessite numéro et code
    transactionCodeLabel: 'Code de Transaction Amana',
    phoneLabel: 'Numéro utilisé pour Amana',
    description: 'Transfert via Amana',
    icon: 'FaMobile',
    confirmationTime: 300000 // 5 minutes en ms
  },
  [PAYMENT_METHODS.TRANSFER_NITA]: {
    name: 'Transfert Nita',
    acceptedCurrencies: ['XOF'],
    minAmount: 1000,
    maxAmount: 5000000,
    requiresVerification: true,
    requiresTransaction: true,
    transactionCodeLabel: 'Code de Transaction Nita',
    phoneLabel: 'Numéro utilisé pour Nita',
    description: 'Transfert via Nita',
    icon: 'FaMobile',
    confirmationTime: 300000 // 5 minutes en ms
  },
  [PAYMENT_METHODS.PAYPAL]: {
    name: 'PayPal',
    acceptedCurrencies: ['USD', 'EUR', 'GBP'], // PayPal accepte plusieurs devises
    minAmount: 1, // 1 cent USD minimum
    maxAmount: 999999.99,
    requiresVerification: false,
    requiresTransaction: false,
    description: 'Paiement sécurisé via PayPal',
    icon: 'FaPaypal',
    requiresConversion: true, // Nécessite conversion XOF vers USD
    defaultCurrency: 'USD' // Devise par défaut pour PayPal
  }
};

/**
 * Taux de change de référence et leurs limites
 * À synchroniser avec la table currencies en DB
 */
export const EXCHANGE_RATES = {
  XOF: 1, // Devise de base
  USD: 600, // 1 USD = 600 XOF (à jour depuis DB)
  EUR: 650,
  GBP: 750
};

/**
 * Configuration de frais de paiement (commission par méthode)
 */
export const PAYMENT_FEES = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: 0, // Pas de frais
  [PAYMENT_METHODS.TRANSFER_AMANA]: 0.02, // 2% de frais
  [PAYMENT_METHODS.TRANSFER_NITA]: 0.02, // 2% de frais
  [PAYMENT_METHODS.PAYPAL]: 0.034 // 3.4% + frais fixes (à confirmer)
};

/**
 * Configuration des délais de traitement
 */
export const PROCESSING_TIMES = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: {
    confirmation: 'À la livraison',
    settlement: '24-48h après livraison'
  },
  [PAYMENT_METHODS.TRANSFER_AMANA]: {
    confirmation: '5 minutes',
    settlement: '24h'
  },
  [PAYMENT_METHODS.TRANSFER_NITA]: {
    confirmation: '5 minutes',
    settlement: '24h'
  },
  [PAYMENT_METHODS.PAYPAL]: {
    confirmation: 'Immédiat',
    settlement: '1-3 jours'
  }
};

/**
 * Valide si un montant est acceptable pour une méthode de paiement
 * @param {number} amount - Montant en la devise de la méthode
 * @param {string} method - PAYMENT_METHODS.XXX
 * @returns {object} { valid: boolean, error?: string }
 */
export function validatePaymentAmount(amount, method) {
  const rules = PAYMENT_RULES[method];
  
  if (!rules) {
    return { valid: false, error: `Méthode de paiement ${method} inconnue` };
  }

  if (amount < rules.minAmount) {
    return {
      valid: false,
      error: `Montant minimum: ${rules.minAmount} ${rules.acceptedCurrencies[0]}`
    };
  }

  if (amount > rules.maxAmount) {
    return {
      valid: false,
      error: `Montant maximum: ${rules.maxAmount} ${rules.acceptedCurrencies[0]}`
    };
  }

  return { valid: true };
}

/**
 * Calcule les frais de paiement
 * @param {number} amount - Montant de base
 * @param {string} method - PAYMENT_METHODS.XXX
 * @returns {number} Montant des frais
 */
export function calculatePaymentFee(amount, method) {
  const feeRate = PAYMENT_FEES[method] || 0;
  return amount * feeRate;
}

/**
 * Obtient la devise à utiliser pour une méthode
 * @param {string} method - PAYMENT_METHODS.XXX
 * @param {string} userPreferredCurrency - Devise préférée de l'utilisateur
 * @returns {string} Devise à utiliser
 */
export function getPaymentCurrency(method, userPreferredCurrency = 'XOF') {
  const rules = PAYMENT_RULES[method];
  
  if (!rules) return userPreferredCurrency;

  // Si PayPal, utiliser USD sauf si spécifié
  if (method === PAYMENT_METHODS.PAYPAL) {
    return rules.defaultCurrency;
  }

  // Pour les autres méthodes, utiliser XOF
  return 'XOF';
}

/**
 * Vérifie si une méthode de paiement nécessite une conversion
 * @param {string} method - PAYMENT_METHODS.XXX
 * @returns {boolean}
 */
export function requiresConversion(method) {
  const rules = PAYMENT_RULES[method];
  return rules?.requiresConversion ?? false;
}

/**
 * Obtient les informations de frais pour affichage
 * @param {number} amount - Montant de base
 * @param {string} method - PAYMENT_METHODS.XXX
 * @returns {object} { amount, fee, total, feePercentage }
 */
export function getFeeBreakdown(amount, method) {
  const fee = calculatePaymentFee(amount, method);
  const feePercentage = (PAYMENT_FEES[method] || 0) * 100;
  
  return {
    subtotal: amount,
    fee,
    total: amount + fee,
    feePercentage
  };
}

/**
 * Exporte un objet de configuration pour utilisation dans les composants
 */
export const paymentConfig = {
  methods: PAYMENT_METHODS,
  statuses: PAYMENT_STATUSES,
  orderStatuses: ORDER_STATUSES,
  rules: PAYMENT_RULES,
  validateAmount: validatePaymentAmount,
  calculateFee: calculatePaymentFee,
  getCurrency: getPaymentCurrency,
  requiresConversion,
  getFeeBreakdown
};

export default paymentConfig;
