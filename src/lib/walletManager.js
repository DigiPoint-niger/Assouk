/**
 * Système de Wallets Vendeurs - ASSOUK
 * Gère les portefeuilles, transactions et distribution de paiements
 */

import { createServerClient } from '@/lib/supabaseServer';
import { v4 as uuidv4 } from 'uuid';

/**
 * Types de transactions de portefeuille
 */
export const TRANSACTION_TYPES = {
  CREDIT: 'credit', // Argent entrant
  DEBIT: 'debit'    // Argent sortant
};

/**
 * Raisons courantes de transactions
 */
export const TRANSACTION_REASONS = {
  PAYMENT_RECEIVED: 'Paiement reçu',
  COMMISSION_DEDUCTED: 'Commission prélevée',
  WITHDRAWAL_REQUEST: 'Demande de retrait',
  WITHDRAWAL_APPROVED: 'Retrait approuvé',
  REFUND_ISSUED: 'Remboursement émis',
  DISPUTE_DEDUCTION: 'Déduction pour litige',
  BONUS_ADDED: 'Bonus ajouté',
  FEES_DEDUCTED: 'Frais déduits'
};

/**
 * Obtient ou crée le portefeuille d'un vendeur
 * @param {string} userId - ID du vendeur (profile.id)
 * @param {string} currency - Code devise (défaut: 'XOF')
 * @returns {Promise<object>} { id, user_id, balance, currency, created_at }
 */
export async function getOrCreateWallet(userId, currency = 'XOF') {
  try {
    const supabase = createServerClient();

    // Chercher le portefeuille existant
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!fetchError && wallet) {
      return { wallet, created: false };
    }

    // Créer un nouveau portefeuille
    const newWallet = {
      user_id: userId,
      balance: 0,
      currency,
      created_at: new Date().toISOString()
    };

    const { data: created, error: createError } = await supabase
      .from('wallets')
      .insert([newWallet])
      .select()
      .single();

    if (createError) {
      throw new Error(`Erreur création portefeuille: ${createError.message}`);
    }

    return { wallet: created, created: true };
  } catch (error) {
    console.error('Erreur getOrCreateWallet:', error);
    throw error;
  }
}

/**
 * Ajoute une transaction au portefeuille du vendeur
 * Appelée automatiquement après chaque paiement reçu
 * @param {string} userId - ID du vendeur
 * @param {string} type - TRANSACTION_TYPES.CREDIT ou DEBIT
 * @param {number} amount - Montant
 * @param {string} currency - Devise
 * @param {string} description - Description de la transaction
 * @param {string} relatedOrderId - ID de commande liée (optionnel)
 * @returns {Promise<object>}
 */
export async function addWalletTransaction(
  userId,
  type,
  amount,
  currency = 'XOF',
  description = '',
  relatedOrderId = null
) {
  try {
    const supabase = createServerClient();

    // Vérifier/créer le portefeuille
    const { wallet } = await getOrCreateWallet(userId, currency);

    // Créer la transaction
    const transaction = {
      wallet_id: wallet.id,
      type,
      amount,
      currency,
      description,
      order_id: relatedOrderId,
      created_at: new Date().toISOString()
    };

    const { data: created, error: txError } = await supabase
      .from('wallet_transactions')
      .insert([transaction])
      .select()
      .single();

    if (txError) {
      throw new Error(`Erreur transaction: ${txError.message}`);
    }

    // Mettre à jour le solde du portefeuille
    const newBalance = type === TRANSACTION_TYPES.CREDIT
      ? wallet.balance + amount
      : wallet.balance - amount;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      throw new Error(`Erreur mise à jour solde: ${updateError.message}`);
    }

    return {
      transaction: created,
      newBalance
    };
  } catch (error) {
    console.error('Erreur addWalletTransaction:', error);
    throw error;
  }
}

/**
 * Distribue le paiement d'une commande au vendeur
 * Appelée après confirmation du paiement PayPal ou autre
 * @param {string} orderId - ID de la commande
 * @param {number} amount - Montant à distribuer (déjà en devise du vendeur)
 * @param {string} currency - Devise
 * @param {string} method - Méthode de paiement
 * @returns {Promise<object>}
 */
export async function distributeOrderPayment(orderId, amount, currency, method) {
  try {
    const supabase = createServerClient();

    // Récupérer la commande pour obtenir seller_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('seller_id, client_id, total, currency')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Commande ${orderId} non trouvée`);
    }

  // Calculer la commission (exemple: 5% pour ASSOUK)
    const COMMISSION_RATE = 0.05; // 5%
    const commission = amount * COMMISSION_RATE;
    const vendorAmount = amount - commission;

    // Ajouter transaction au portefeuille du vendeur
    const { newBalance } = await addWalletTransaction(
      order.seller_id,
      TRANSACTION_TYPES.CREDIT,
      vendorAmount,
      currency,
      `Paiement reçu pour commande #${orderId.substring(0, 8)}`,
      orderId
    );

    // Ajouter transaction pour les frais de plateforme
    // (peut être sur un portefeuille "admin" ou simplement loggé)
    console.log(`[COMMISSION] Commande ${orderId}: ${commission} ${currency} prélevé`);

    return {
      orderId,
      vendorId: order.seller_id,
      originalAmount: amount,
      commission,
      vendorAmount,
      newBalance,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur distributeOrderPayment:', error);
    throw error;
  }
}

/**
 * Obtient l'historique des transactions d'un vendeur
 * @param {string} userId - ID du vendeur
 * @param {number} limit - Nombre de transactions à récupérer
 * @param {number} offset - Décalage pour pagination
 * @returns {Promise<array>}
 */
export async function getWalletTransactions(userId, limit = 50, offset = 0) {
  try {
    const supabase = createServerClient();

    // Récupérer le portefeuille
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (walletError) {
      throw new Error('Portefeuille non trouvé');
    }

    // Récupérer les transactions
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select(`
        *,
        orders(id, total, status)
      `)
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {
      throw new Error(`Erreur récupération transactions: ${txError.message}`);
    }

    return transactions || [];
  } catch (error) {
    console.error('Erreur getWalletTransactions:', error);
    throw error;
  }
}

/**
 * Obtient le solde du portefeuille d'un vendeur
 * @param {string} userId - ID du vendeur
 * @returns {Promise<number>}
 */
export async function getWalletBalance(userId) {
  try {
    const supabase = createServerClient();

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance, currency')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error('Portefeuille non trouvé');
    }

    return wallet;
  } catch (error) {
    console.error('Erreur getWalletBalance:', error);
    throw error;
  }
}

/**
 * Crée une demande de retrait (withdrawal request)
 * @param {string} userId - ID du vendeur
 * @param {number} amount - Montant à retirer
 * @param {string} method - Méthode de retrait (bank_transfer, mobile_money, etc.)
 * @param {object} details - Détails du retrait (IBAN, numéro de compte, etc.)
 * @returns {Promise<object>}
 */
export async function createWithdrawalRequest(userId, amount, method, details) {
  try {
    const supabase = createServerClient();

    // Vérifier le solde disponible
    const wallet = await getWalletBalance(userId);
    if (wallet.balance < amount) {
      throw new Error('Solde insuffisant pour ce retrait');
    }

    // Créer la demande de retrait
    // Note: Table withdrawal_requests non définie dans le schéma actuel
    // À ajouter en base de données
    const withdrawal = {
      vendor_id: userId,
      amount,
      currency: wallet.currency,
      method,
      details: JSON.stringify(details),
      status: 'pending', // pending, approved, completed, rejected
      created_at: new Date().toISOString()
    };

    // Débiter le portefeuille immédiatement (avec statut pending)
    await addWalletTransaction(
      userId,
      TRANSACTION_TYPES.DEBIT,
      amount,
      wallet.currency,
      TRANSACTION_REASONS.WITHDRAWAL_REQUEST
    );

    return {
      success: true,
      message: `Demande de retrait de ${amount} ${wallet.currency} créée`,
      amount,
      status: 'pending'
    };
  } catch (error) {
    console.error('Erreur createWithdrawalRequest:', error);
    throw error;
  }
}

/**
 * Module complet de gestion des wallets
 */
export const walletManager = {
  getOrCreateWallet,
  addWalletTransaction,
  distributeOrderPayment,
  getWalletTransactions,
  getWalletBalance,
  createWithdrawalRequest,
  transactionTypes: TRANSACTION_TYPES,
  reasons: TRANSACTION_REASONS
};

export default walletManager;
