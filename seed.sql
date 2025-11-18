-- ========================
-- 1. CURRENCIES & SUBSCRIPTION PLANS
-- ========================

INSERT INTO public.currencies (code, name, symbol, value_in_fcfa)
VALUES
('XOF', 'Franc CFA', '₣', 1),
('USD', 'Dollar US', '$', 650),
('EUR', 'Euro', '€', 700);

INSERT INTO public.subscription_plans (name, price, max_products, max_ads, max_wallet_balance)
VALUES
('Basic', 0, 50, 5, 100000),
('Pro', 5000, 200, 20, 500000),
('Enterprise', 15000, 1000, 50, 2000000);

-- ========================
-- 2. PROFILES (USERS)
-- ========================

-- ⚠️ Supabase exige que les users existent déjà dans auth.users, ici on simule avec UUIDs
('0b73b547-09ee-4961-92d2-74f13e3022f5', 'Bob Seller', '900000002', 'seller', true, 'verified', (SELECT id FROM public.subscription_plans WHERE name='Pro')),
('ed7243ee-c58e-4dca-92e5-335c9bf8ebe2', 'Charlie Deliverer', '900000003', 'deliverer', false, 'none', (SELECT id FROM public.subscription_plans WHERE name='Basic')),
('ebada03a-e4b6-4a9d-b2a6-6c744475da43','tabbilal.boutique@gmail.com', 'Ali Tajissir', '+213796537594', 'admin', true, 'verified');

-- ========================
-- 3. CATEGORIES
-- ========================

INSERT INTO public.categories (name, description)
VALUES
('Électronique', 'Téléphones, ordinateurs, gadgets'),
('Mode', 'Vêtements et accessoires'),
('Maison', 'Articles ménagers et décoration');

-- ========================
-- 4. PRODUCTS
-- ========================

INSERT INTO public.products (seller_id, category_id, name, description, price, stock, images, is_featured)
VALUES
(
 (SELECT id FROM public.profiles WHERE name='Bob Seller'),
 (SELECT id FROM public.categories WHERE name='Électronique'),
 'Smartphone X1', 'Un smartphone rapide avec 128GB de stockage', 120000, 25, ARRAY['/images/smartphone1.png'], true
),
(
 (SELECT id FROM public.profiles WHERE name='Bob Seller'),
 (SELECT id FROM public.categories WHERE name='Mode'),
 'T-shirt Premium', 'T-shirt en coton bio', 5000, 100, ARRAY['/images/tshirt.png'], false
),
(
 (SELECT id FROM public.profiles WHERE name='Bob Seller'),
 (SELECT id FROM public.categories WHERE name='Maison'),
 'Lampe LED', 'Lampe éco à intensité réglable', 15000, 40, ARRAY['/images/lampe.png'], false
);

-- ========================
-- 5. ADS & AD_VIEWS
-- ========================

INSERT INTO public.ads (owner_id, title, image, target_url, max_views)
VALUES
((SELECT id FROM public.profiles WHERE name='Bob Seller'), 'Promo Smartphone X1', '/ads/ad1.png', 'https://shop.example.com/x1', 1000),
((SELECT id FROM public.profiles WHERE name='Bob Seller'), 'Nouvelle Collection Mode', '/ads/ad2.png', 'https://shop.example.com/mode', 500);

INSERT INTO public.ad_views (ad_id, user_id)
VALUES
((SELECT id FROM public.ads WHERE title='Promo Smartphone X1'), (SELECT id FROM public.profiles WHERE name='Alice Client')),
((SELECT id FROM public.ads WHERE title='Promo Smartphone X1'), (SELECT id FROM public.profiles WHERE name='Charlie Deliverer'));

-- ========================
-- 6. ORDERS & ITEMS
-- ========================

INSERT INTO public.orders (client_id, seller_id, deliverer_id, total, payment_method, payment_status, currency, delivery_address, delivery_phone)
VALUES
(
 (SELECT id FROM public.profiles WHERE name='Alice Client'),
 (SELECT id FROM public.profiles WHERE name='Bob Seller'),
 (SELECT id FROM public.profiles WHERE name='Charlie Deliverer'),
 125000, 'cash_on_delivery', 'completed', 'XOF', 'Quartier Plateau', '900000001'
);

INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price)
VALUES
(
 (SELECT id FROM public.orders LIMIT 1),
 (SELECT id FROM public.products WHERE name='Smartphone X1'),
 1, 120000, 120000
);

-- ========================
-- 7. PAYMENTS
-- ========================

INSERT INTO public.payments (user_id, order_id, amount, method, status, currency, transaction_phone, transaction_code)
VALUES
(
 (SELECT id FROM public.profiles WHERE name='Alice Client'),
 (SELECT id FROM public.orders LIMIT 1),
 125000, 'cash_on_delivery', 'completed', 'XOF', '900000001', 'CMD12345'
);

-- ========================
-- 8. WALLETS & TRANSACTIONS
-- ========================

INSERT INTO public.wallets (user_id, balance, currency)
VALUES
((SELECT id FROM public.profiles WHERE name='Alice Client'), 50000, 'XOF'),
((SELECT id FROM public.profiles WHERE name='Bob Seller'), 200000, 'XOF');

INSERT INTO public.wallet_transactions (wallet_id, type, amount, currency, description)
VALUES
(
 (SELECT id FROM public.wallets WHERE user_id=(SELECT id FROM public.profiles WHERE name='Bob Seller')),
 'credit', 50000, 'XOF', 'Paiement reçu d’une commande'
),
(
 (SELECT id FROM public.wallets WHERE user_id=(SELECT id FROM public.profiles WHERE name='Alice Client')),
 'debit', 5000, 'XOF', 'Achat d’un T-shirt Premium'
);

-- ========================
-- 9. RATINGS & COMMENTS
-- ========================

INSERT INTO public.product_ratings (product_id, user_id, rating)
VALUES
((SELECT id FROM public.products WHERE name='Smartphone X1'), (SELECT id FROM public.profiles WHERE name='Alice Client'), 5);

INSERT INTO public.comments (product_id, user_id, content)
VALUES
((SELECT id FROM public.products WHERE name='Smartphone X1'), (SELECT id FROM public.profiles WHERE name='Alice Client'), 'Excellent produit, très fluide.');

INSERT INTO public.seller_ratings (seller_id, user_id, rating, comment)
VALUES
((SELECT id FROM public.profiles WHERE name='Bob Seller'), (SELECT id FROM public.profiles WHERE name='Alice Client'), 5, 'Très bon vendeur, livraison rapide.');

-- ========================
-- 10. PLATFORM SETTINGS
-- ========================

INSERT INTO public.platform_settings (key, value)
VALUES
('platform_enabled', 'true'),
('seller_registration_enabled', 'true'),
('deliverer_registration_enabled', 'true'),
('client_registration_enabled', 'true'),
('default_currency', 'XOF');
