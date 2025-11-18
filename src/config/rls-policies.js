/**
 * Configuration RLS (Row Level Security) Supabase
 * 
 * IMPORTANT: Ces règles DOIVENT être configurées dans la console Supabase.
 * Ce fichier est une documentation de ce qui doit être implémenté.
 * 
 * RLS sécurise l'accès aux données au niveau de la base de données,
 * en empêchant les utilisateurs d'accéder à des données qui ne leur appartiennent pas.
 */

export const RLS_POLICIES = {
  // ============================================
  // TABLE: profiles
  // ============================================
  profiles: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read own profile",
        command: "SELECT",
        definition: `auth.uid() = id`,
        for_role: "authenticated",
        description: "Utilisateurs peuvent voir leur propre profil"
      },
      {
        name: "Enable update own profile",
        command: "UPDATE",
        definition: `auth.uid() = id`,
        for_role: "authenticated",
        description: "Utilisateurs peuvent mettre à jour leur propre profil"
      },
      {
        name: "Enable insert profile on signup",
        command: "INSERT",
        definition: `auth.uid() = id`,
        for_role: "authenticated",
        description: "Utilisateurs peuvent créer leur profil lors de l'inscription"
      }
    ]
  },

  // ============================================
  // TABLE: products
  // ============================================
  products: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read all products",
        command: "SELECT",
        definition: `true`,
        for_role: "anon",
        description: "Tous peuvent lire les produits (publique)"
      },
      {
        name: "Enable insert for sellers",
        command: "INSERT",
        definition: `
          auth.uid() = seller_id AND
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'seller'
        `,
        for_role: "authenticated",
        description: "Seuls les vendeurs peuvent créer des produits"
      },
      {
        name: "Enable update own products",
        command: "UPDATE",
        definition: `
          auth.uid() = seller_id AND
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'seller'
        `,
        for_role: "authenticated",
        description: "Vendeurs ne peuvent modifier que leurs propres produits"
      },
      {
        name: "Enable delete own products",
        command: "DELETE",
        definition: `
          auth.uid() = seller_id AND
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'seller'
        `,
        for_role: "authenticated",
        description: "Vendeurs ne peuvent supprimer que leurs propres produits"
      }
    ]
  },

  // ============================================
  // TABLE: orders
  // ============================================
  orders: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read own orders as client",
        command: "SELECT",
        definition: `auth.uid() = client_id`,
        for_role: "authenticated",
        description: "Clients voient leurs propres commandes"
      },
      {
        name: "Enable read own orders as seller",
        command: "SELECT",
        definition: `auth.uid() = seller_id`,
        for_role: "authenticated",
        description: "Vendeurs voient les commandes qu'ils ont reçues"
      },
      {
        name: "Enable insert orders",
        command: "INSERT",
        definition: `auth.uid() = client_id`,
        for_role: "authenticated",
        description: "Clients peuvent créer des commandes"
      },
      {
        name: "Enable update status as seller",
        command: "UPDATE",
        definition: `auth.uid() = seller_id`,
        for_role: "authenticated",
        description: "Vendeurs peuvent mettre à jour le statut (pending → confirmed, etc.)"
      }
    ]
  },

  // ============================================
  // TABLE: order_items
  // ============================================
  order_items: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read related to own orders",
        command: "SELECT",
        definition: `
          EXISTS(
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id
            AND (orders.client_id = auth.uid() OR orders.seller_id = auth.uid())
          )
        `,
        for_role: "authenticated",
        description: "Peut lire les items des commandes dont on est client ou vendeur"
      }
    ]
  },

  // ============================================
  // TABLE: payments
  // ============================================
  payments: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read own payments",
        command: "SELECT",
        definition: `auth.uid() = user_id`,
        for_role: "authenticated",
        description: "Utilisateurs voient leurs propres paiements"
      },
      {
        name: "Enable insert own payments",
        command: "INSERT",
        definition: `auth.uid() = user_id`,
        for_role: "authenticated",
        description: "Utilisateurs peuvent insérer leurs propres paiements"
      }
    ]
  },

  // ============================================
  // TABLE: wallets
  // ============================================
  wallets: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read own wallet",
        command: "SELECT",
        definition: `auth.uid() = user_id`,
        for_role: "authenticated",
        description: "Utilisateurs voient leur propre portefeuille"
      },
      {
        name: "Enable insert own wallet",
        command: "INSERT",
        definition: `auth.uid() = user_id`,
        for_role: "authenticated",
        description: "Utilisateurs peuvent créer leur portefeuille"
      },
      {
        name: "Enable update own wallet",
        command: "UPDATE",
        definition: `auth.uid() = user_id`,
        for_role: "authenticated",
        description: "Utilisateurs peuvent mettre à jour leur portefeuille"
      }
    ]
  },

  // ============================================
  // TABLE: wallet_transactions
  // ============================================
  wallet_transactions: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read own transactions",
        command: "SELECT",
        definition: `
          EXISTS(
            SELECT 1 FROM wallets 
            WHERE wallets.id = wallet_transactions.wallet_id
            AND wallets.user_id = auth.uid()
          )
        `,
        for_role: "authenticated",
        description: "Utilisateurs voient les transactions de leur portefeuille"
      }
    ]
  },

  // ============================================
  // TABLE: messages
  // ============================================
  messages: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read own messages",
        command: "SELECT",
        definition: `
          auth.uid() = sender_id OR auth.uid() = receiver_id
        `,
        for_role: "authenticated",
        description: "Utilisateurs voient les messages qu'ils ont envoyés ou reçus"
      },
      {
        name: "Enable send messages",
        command: "INSERT",
        definition: `
          auth.uid() = sender_id
        `,
        for_role: "authenticated",
        description: "Utilisateurs peuvent envoyer des messages (en tant que sender_id)"
      }
    ]
  },

  // ============================================
  // TABLE: product_ratings
  // ============================================
  product_ratings: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read all ratings",
        command: "SELECT",
        definition: `true`,
        for_role: "anon",
        description: "Tous peuvent voir les avis produits"
      },
      {
        name: "Enable insert own rating",
        command: "INSERT",
        definition: `auth.uid() = user_id`,
        for_role: "authenticated",
        description: "Utilisateurs peuvent donner un avis (une fois par produit)"
      },
      {
        name: "Enable update own rating",
        command: "UPDATE",
        definition: `auth.uid() = user_id`,
        for_role: "authenticated",
        description: "Utilisateurs peuvent modifier leur propre avis"
      }
    ]
  },

  // ============================================
  // TABLE: platform_settings
  // ============================================
  platform_settings: {
    enable_rls: true,
    policies: [
      {
        name: "Enable read settings",
        command: "SELECT",
        definition: `true`,
        for_role: "anon",
        description: "Paramètres publiques lisibles par tous"
      },
      {
        name: "Enable update only for admin",
        command: "UPDATE",
        definition: `
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        `,
        for_role: "authenticated",
        description: "Seuls les admins peuvent modifier les paramètres"
      }
    ]
  }
};

/**
 * Instructions pour implémenter les RLS dans Supabase:
 * 
 * 1. Se connecter à la console Supabase
 * 2. Aller à Authentication → Policies
 * 3. Pour chaque table avec enable_rls: true:
 *    a. Activer RLS sur la table
 *    b. Créer les policies listées
 * 
 * Syntaxe SQL pour créer une policy:
 * 
 * CREATE POLICY "policy_name" ON table_name
 * FOR [SELECT|INSERT|UPDATE|DELETE]
 * TO [role]
 * USING (policy_definition);
 * 
 * Exemple pour products:
 * 
 * CREATE POLICY "Enable read all products" ON products
 * FOR SELECT
 * TO anon
 * USING (true);
 * 
 * CREATE POLICY "Enable insert for sellers" ON products
 * FOR INSERT
 * TO authenticated
 * WITH CHECK (
 *   auth.uid() = seller_id AND
 *   (SELECT role FROM profiles WHERE id = auth.uid()) = 'seller'
 * );
 */

export const RLS_IMPLEMENTATION_GUIDE = `
# IMPLÉMENTATION DES RLS DANS SUPABASE

## Étape 1: Activer RLS sur les tables

\`\`\`sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
\`\`\`

## Étape 2: Créer les policies

Les policies SQL sont dans ce fichier, à exécuter dans l'éditeur SQL Supabase.

## Étape 3: Tester les policies

1. Utiliser l'onglet "Policies" dans Supabase pour vérifier
2. Tester avec différents utilisateurs (client, seller, admin)
3. Vérifier que les données non-autorisées ne sont pas accessibles

## Points Clés

✓ Les clients ne voient que leurs propres commandes
✓ Les vendeurs ne modifient que leurs produits
✓ Les admins peuvent accéder à tous les paramètres
✓ Les wallets sont isolés par utilisateur
✓ Les messages sont privés entre utilisateurs
`;

export default RLS_POLICIES;
