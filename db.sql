-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

------------------------------------------------------------
-- TABLE: subscription_plans
------------------------------------------------------------
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric DEFAULT 0,
  max_products integer DEFAULT 50,
  max_ads integer DEFAULT 5,
  max_wallet_balance numeric DEFAULT 100000,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: profiles
------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  phone text UNIQUE,
  role text DEFAULT 'client' CHECK (role IN ('client','seller','deliverer','admin')),
  is_verified boolean DEFAULT false,
  badge text DEFAULT 'none' CHECK (badge IN ('none','pending','verified')),
  subscription_plan uuid REFERENCES public.subscription_plans(id),
  created_at timestamp with time zone DEFAULT now(),
  avg_rating numeric DEFAULT 0.0,
  delivery_fee numeric DEFAULT 0.0,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: categories
------------------------------------------------------------
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES public.categories(id),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: products
------------------------------------------------------------
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES public.profiles(id),
  category_id uuid REFERENCES public.categories(id),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  stock integer DEFAULT 0,
  images text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: product_ratings
------------------------------------------------------------
CREATE TABLE public.product_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_ratings_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: ads
------------------------------------------------------------
CREATE TABLE public.ads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  image text NOT NULL,
  target_url text,
  max_views integer NOT NULL,
  current_views integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ads_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: ad_views
------------------------------------------------------------
CREATE TABLE public.ad_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.ads(id),
  user_id uuid REFERENCES public.profiles(id),
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ad_views_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: currencies
------------------------------------------------------------
CREATE TABLE public.currencies (
  code text NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  value_in_fcfa numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT currencies_pkey PRIMARY KEY (code)
);

------------------------------------------------------------
-- TABLE: orders
------------------------------------------------------------
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles(id),
  seller_id uuid REFERENCES public.profiles(id),
  deliverer_id uuid REFERENCES public.profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','delivering','delivered','canceled')),
  total numeric NOT NULL,
  payment_method text CHECK (payment_method IN ('cash_on_delivery','transfer_amana','transfer_nita','paypal')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','completed','failed')),
  currency text REFERENCES public.currencies(code),
  created_at timestamp with time zone DEFAULT now(),
  delivery_address text,
  delivery_phone text,
  delivery_fee numeric DEFAULT 0.0,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: order_items
------------------------------------------------------------
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: payments
------------------------------------------------------------
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  order_id uuid REFERENCES public.orders(id),
  amount numeric NOT NULL,
  method text NOT NULL CHECK (method IN ('cash_on_delivery','transfer_amana','transfer_nita','paypal')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  currency text REFERENCES public.currencies(code),
  created_at timestamp with time zone DEFAULT now(),
  transaction_phone text,
  transaction_code text,
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: messages
------------------------------------------------------------
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id),
  receiver_id uuid REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: comments
------------------------------------------------------------
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: seller_ratings
------------------------------------------------------------
CREATE TABLE public.seller_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT seller_ratings_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: seller_reviews
------------------------------------------------------------
CREATE TABLE public.seller_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id),
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT seller_reviews_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: wallets
------------------------------------------------------------
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.profiles(id),
  balance numeric DEFAULT 0,
  currency text REFERENCES public.currencies(code),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: wallet_transactions
------------------------------------------------------------
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES public.wallets(id),
  type text NOT NULL CHECK (type IN ('credit','debit')),
  amount numeric NOT NULL,
  currency text REFERENCES public.currencies(code),
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id)
);

------------------------------------------------------------
-- TABLE: platform_settings
------------------------------------------------------------
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT platform_settings_pkey PRIMARY KEY (id)
);

-- Ajouter ces colonnes à la table orders pour mieux gérer les livraisons
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_notes text;
-- Table pour suivre les paiements des livreurs
CREATE TABLE public.deliverer_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deliverer_id uuid REFERENCES public.profiles(id),
  order_id uuid REFERENCES public.orders(id),
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  payment_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deliverer_payments_pkey PRIMARY KEY (id)
);

-- Ajouter un champ pour suivre quand les gains sont versés au livreur
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deliverer_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deliverer_payment_date timestamp with time zone;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_orders_deliverer_status ON public.orders(deliverer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_deliverer_paid ON public.orders(deliverer_id, deliverer_paid);
-- Ajouter les champs manquants pour le suivi des livraisons
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_notes text;

-- Table pour le suivi géographique des livraisons (optionnel)
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id),
  deliverer_id uuid REFERENCES public.profiles(id),
  latitude numeric,
  longitude numeric,
  status text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_tracking_pkey PRIMARY KEY (id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_orders_deliverer_status_active ON public.orders(deliverer_id, status) 
WHERE status IN ('confirmed', 'delivering');

-- Vue pour les statistiques de performance des livreurs
CREATE OR REPLACE VIEW public.deliverer_performance AS
SELECT 
    p.id as deliverer_id,
    p.name as deliverer_name,
    COUNT(o.id) as total_deliveries,
    AVG(o.delivery_fee) as avg_delivery_fee,
    AVG(EXTRACT(EPOCH FROM (o.delivery_completed_at - o.delivery_started_at))/60) as avg_delivery_time_minutes,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as successful_deliveries,
    COUNT(CASE WHEN o.status = 'canceled' THEN 1 END) as canceled_deliveries
FROM public.profiles p
LEFT JOIN public.orders o ON p.id = o.deliverer_id
WHERE p.role = 'deliverer'
GROUP BY p.id, p.name;