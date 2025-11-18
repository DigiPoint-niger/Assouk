// Fichier : src/app/checkout/page.jsx

"use client";

import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthProvider";
import { useCurrency } from "@/context/CurrencyContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
    FaMoneyBillWave, 
    FaMobile, 
    FaPaypal, 
    FaLock, 
    FaCircleCheck, 
    FaSpinner, 
    FaLocationDot, 
    FaArrowRight,
    FaTruck,
    FaUser,
    FaStar
} from "react-icons/fa6";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

// --- Composants de Présentation ---

const PaymentOption = ({ icon: Icon, title, description, method, selected, onClick }) => (
    <div 
        onClick={onClick}
        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition duration-200 
            ${selected ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
    >
        <Icon className={`text-3xl mr-4 ${selected ? 'text-blue-600' : 'text-gray-500'}`} />
        <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </div>
);

// Nouveau composant pour la sélection des livreurs
const DelivererOption = ({ deliverer, selected, onSelect, loading }) => (
    <div 
        onClick={() => !loading && onSelect(deliverer)}
        className={`p-4 rounded-xl border-2 cursor-pointer transition duration-200 ${
            selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <FaUser className="text-gray-400 text-xl" />
                <div>
                    <h3 className="font-semibold text-lg text-gray-800">{deliverer.name}</h3>
                    <p className="text-sm text-gray-600">{deliverer.phone}</p>
                </div>
            </div>
            {deliverer.avg_rating > 0 && (
                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                    <FaStar className="text-yellow-400 text-sm" />
                    <span className="text-sm font-semibold text-yellow-700">
                        {deliverer.avg_rating.toFixed(1)}
                    </span>
                </div>
            )}
        </div>
        <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-2 text-green-600">
                <FaTruck className="text-sm" />
                <span className="font-semibold">Frais de livraison</span>
            </div>
            <span className="text-lg font-bold text-orange-600">
                {deliverer.delivery_fee} XOF
            </span>
        </div>
    </div>
);

const PayPalPaymentButton = ({ amount, currency, onCreateOrder, onApprove, onError, disabled }) => {
    const [{ isPending }] = usePayPalScriptReducer();
    
    return (
        <div className="min-h-[100px]">
            {isPending ? (
                <div className="flex justify-center items-center h-full p-4">
                    <FaSpinner className="animate-spin text-xl text-blue-600" />
                </div>
            ) : (
                <PayPalButtons
                    style={{ layout: "vertical", color: "blue" }}
                    createOrder={onCreateOrder}
                    onApprove={onApprove}
                    onError={onError}
                    disabled={disabled}
                />
            )}
        </div>
    );
};

// --- Composant Principal de la Page ---

export default function CheckoutPage() {
    const [deliverers, setDeliverers] = useState([]);
    const [selectedDeliverer, setSelectedDeliverer] = useState(null);
    const [delivererFee, setDelivererFee] = useState(0);
    const [delivererLoading, setDelivererLoading] = useState(true);
    const [delivererError, setDelivererError] = useState('');
    
    const { cart, total, clearCart } = useCart();
    const { user, loading: authLoading, getUserProfile } = useAuth();
    const { 
        selectedCurrency,
        getExchangeRate,
        formatPrice: currencyFormatPrice
    } = useCurrency(); 
    
    const router = useRouter();

    const [selectedMethod, setSelectedMethod] = useState('cash_on_delivery');
    const [address, setAddress] = useState({ street: '', city: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState(null);

    const [platformSettings, setPlatformSettings] = useState({ shipping_fee: 0 });
    const [transactionDetails, setTransactionDetails] = useState({
        phone: '',
        code: ''
    });

    // Charger les livreurs vérifiés avec leurs notes moyennes
    useEffect(() => {
        const fetchDeliverers = async () => {
            setDelivererLoading(true);
            setDelivererError('');
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name, phone, delivery_fee, avg_rating')
                    .eq('role', 'deliverer')
                    .eq('is_verified', true)
                    .order('avg_rating', { ascending: false });

                if (error) throw error;
                
                setDeliverers(data || []);
                
                // Sélectionner le premier livreur par défaut
                if (data && data.length > 0) {
                    setSelectedDeliverer(data[0].id);
                    setDelivererFee(data[0].delivery_fee);
                }
            } catch (err) {
                console.error("Erreur chargement livreurs:", err);
                setDelivererError("Erreur lors du chargement des livreurs disponibles.");
            } finally {
                setDelivererLoading(false);
            }
        };
        fetchDeliverers();
    }, []);

    // Calcul des totaux avec les frais de livraison du livreur
    const shippingFeeXOF = useMemo(() => parseFloat(platformSettings.shipping_fee || 0), [platformSettings]);
    const selectedDelivererFee = useMemo(() => parseFloat(delivererFee || 0), [delivererFee]);
    const totalXOF = useMemo(() => total + shippingFeeXOF + selectedDelivererFee, [total, shippingFeeXOF, selectedDelivererFee]);

    const exchangeRate = getExchangeRate(selectedCurrency);
    const totalSelectedCurrency = useMemo(() => {
        if (selectedCurrency === 'XOF') return totalXOF;
        return Math.round((totalXOF / exchangeRate) * 100) / 100;
    }, [totalXOF, exchangeRate, selectedCurrency]);

    const usdRateInXOF = getExchangeRate('USD');
    const totalUSDAmount = useMemo(() => {
        return Math.round((totalXOF / usdRateInXOF) * 100) / 100;
    }, [totalXOF, usdRateInXOF]);
    const totalUSDString = totalUSDAmount.toFixed(2);

    const formatPrice = (amount, currencyCode = selectedCurrency) => {
        return currencyFormatPrice(amount, currencyCode);
    };

    // Redirections initiales
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/checkout");
        }
        if (!authLoading && user && cart.length === 0 && !isOrderPlaced) {
             router.push("/cart");
        }
    }, [user, authLoading, cart, router, isOrderPlaced]);

    // Charger les infos de profil
    useEffect(() => {
        if (user) {
            getUserProfile(user.id).then(profile => {
                if (profile) {
                    setAddress(prev => ({ 
                        ...prev, 
                        phone: profile.phone || '', 
                    }));
                }
            });
        }
    }, [user, getUserProfile]);

    // Charger les paramètres de la plateforme
    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('key, value');

            if (!error && data) {
                const settingsObj = data.reduce((acc, setting) => {
                    acc[setting.key] = setting.value;
                    return acc;
                }, {});
                setPlatformSettings(settingsObj);
            }
        };
        fetchSettings();
    }, []);

    // Gestion de la sélection du livreur
    const handleDelivererSelect = (deliverer) => {
        setSelectedDeliverer(deliverer.id);
        setDelivererFee(deliverer.delivery_fee);
    };

    const isAddressValid = address.street && address.city && address.phone;
    const isDelivererSelected = !!selectedDeliverer;
    
    if (authLoading || (user && cart.length === 0 && !isOrderPlaced)) {
        return <div className="min-h-screen flex items-center justify-center p-8 text-xl text-blue-600"><FaSpinner className="animate-spin mr-3" /> Chargement de la commande...</div>;
    }

    // --- Logique de Base de Données ---

    const createOrderInDatabase = async (paymentMethod) => {
        if (!selectedDeliverer) {
            throw new Error("Veuillez choisir un livreur.");
        }

        // Grouper les items par vendeur
        const itemsByVendor = {};
        cart.forEach(item => {
            if (!item.seller_id) {
                throw new Error("Erreur: produit sans vendeur. Veuillez contacter le support.");
            }
            if (!itemsByVendor[item.seller_id]) {
                itemsByVendor[item.seller_id] = [];
            }
            itemsByVendor[item.seller_id].push(item);
        });

        // Répartition des frais
        const vendorTotals = {};
        let totalProducts = 0;
        Object.entries(itemsByVendor).forEach(([sellerId, vendorItems]) => {
            const vendorTotal = vendorItems.reduce((sum, item) => {
                const itemPrice = item.price || item.prix;
                return sum + (itemPrice * item.quantity);
            }, 0);
            vendorTotals[sellerId] = vendorTotal;
            totalProducts += vendorTotal;
        });

        const orderIds = [];
        const isPayPal = paymentMethod === 'paypal';
        const orderCurrency = isPayPal ? 'USD' : selectedCurrency;

        for (const [sellerId, vendorItems] of Object.entries(itemsByVendor)) {
            // Répartition du shipping fee plateforme
            const vendorShippingFee = totalProducts > 0 ? (vendorTotals[sellerId] / totalProducts) * shippingFeeXOF : 0;
            // Frais livreur (en XOF) - appliqué en totalité à la première commande ou réparti selon votre logique
            const vendorDelivererFee = orderIds.length === 0 ? selectedDelivererFee : 0; // Ou répartir différemment

            let vendorTotal = vendorTotals[sellerId] + vendorShippingFee + vendorDelivererFee;

            // Conversion selon la méthode de paiement
            let vendorTotalInOrderCurrency;
            if (isPayPal) {
                vendorTotalInOrderCurrency = Math.round((vendorTotal / usdRateInXOF) * 100) / 100;
            } else {
                vendorTotalInOrderCurrency = Math.round((vendorTotal / exchangeRate) * 100) / 100;
            }

            const orderPayload = {
                client_id: user.id,
                seller_id: sellerId,
                deliverer_id: selectedDeliverer,
                status: 'pending',
                total: vendorTotalInOrderCurrency,
                payment_method: paymentMethod,
                payment_status: 'pending',
                currency: orderCurrency,
                delivery_address: `${address.street}, ${address.city}`,
                delivery_phone: address.phone,
                delivery_fee: vendorDelivererFee
            };

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([orderPayload])
                .select()
                .single();

            if (orderError) throw orderError;

            // Insertion des OrderItems
            const orderItemsPayload = vendorItems.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price || item.prix,
                total_price: (item.price || item.prix) * item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsPayload);

            if (itemsError) throw itemsError;

            // Notification Telegram
            try {
                const selectedDelivererInfo = deliverers.find(d => d.id === selectedDeliverer);
                let itemsText = vendorItems.map(item => `• ${item.quantity} x ${item.name} (${formatPrice((item.price || item.prix) * item.quantity, orderCurrency)})`).join('\n');
                let message = `🛒 Nouvelle commande #${orderData.id}\n\nClient: ${user?.email || user?.id}\nAdresse: ${orderPayload.delivery_address}\nTéléphone: ${orderPayload.delivery_phone}\n\nProduits:\n${itemsText}\n\nTotal: ${formatPrice(vendorTotalInOrderCurrency, orderCurrency)}\nMéthode: ${paymentMethod}\nLivreur: ${selectedDelivererInfo?.name || ''} (${formatPrice(vendorDelivererFee, orderCurrency)})`;
                
                await fetch('/api/telegram/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
            } catch (err) {
                console.error('Erreur notification Telegram:', err);
            }

            orderIds.push(orderData.id);
        }

        return orderIds;
    };

    const updatePaymentStatus = async (orderId, status) => {
        const { error } = await supabase
            .from('orders')
            .update({ 
                payment_status: status,
                status: status === 'completed' ? 'confirmed' : 'pending'
            })
            .eq('id', orderId);

        if (error) throw error;
    };

    // --- Handlers PayPal ---
    
    const [orderIds, setOrderIds] = useState([]);
    
    const createPayPalOrder = async () => {
        if (!isAddressValid || !isDelivererSelected) {
             throw new Error("Veuillez remplir votre adresse de livraison et choisir un livreur.");
        }

        try {
            setError('');
            setLoading(true);

            const dbOrderIds = await createOrderInDatabase('paypal'); 
            setOrderIds(dbOrderIds);

            const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalUSDString, 
                    currency: 'USD', 
                    orderIds: dbOrderIds
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur création commande PayPal');
            }

            return data.id;

        } catch (error) {
            console.error('Erreur création commande:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    const onPayPalApprove = async (data, actions) => {
        setLoading(true);
        try {
            const order = await actions.order.capture();
            
            for (const orderId of orderIds) {
                await updatePaymentStatus(orderId, 'completed');
                
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('total')
                    .eq('id', orderId)
                    .single();
                
                if (orderData) {
                    await supabase.from('payments').insert([{
                        user_id: user.id,
                        order_id: orderId,
                        amount: orderData.total,
                        method: 'paypal',
                        status: 'completed',
                        currency: 'USD',
                        transaction_id: order.id
                    }]);
                }
            }

            clearCart();
            setIsOrderPlaced(true);
            
        } catch (error) {
            console.error("Erreur de capture PayPal:", error);
            for (const orderId of orderIds) {
                await updatePaymentStatus(orderId, 'failed');
            }
            setError("Erreur lors de la validation du paiement PayPal.");
        } finally {
            setLoading(false);
        }
    };
    
    const onPayPalError = (err) => {
        console.error("Erreur PayPal:", err);
        if (orderIds.length > 0) {
            orderIds.forEach(id => {
                updatePaymentStatus(id, 'failed');
            });
        }
        setError("Le paiement PayPal a échoué. Veuillez réessayer ou choisir une autre méthode.");
    };

    // --- Handler pour les autres paiements ---
    
    const handleOtherPayment = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!isAddressValid) {
            setError("Veuillez remplir votre adresse de livraison complète.");
            return;
        }

        if (!isDelivererSelected) {
            setError("Veuillez choisir un livreur.");
            return;
        }

        if (selectedMethod.startsWith('transfer_') && (!transactionDetails.phone || !transactionDetails.code)) {
            setError("Veuillez fournir les détails du transfert (numéro et code de transaction).");
            return;
        }
        
        setLoading(true);
        
        try {
            const dbOrderIds = await createOrderInDatabase(selectedMethod);
            
            for (const dbOrderId of dbOrderIds) {
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('total')
                    .eq('id', dbOrderId)
                    .single();

                const paymentPayload = {
                    user_id: user.id,
                    order_id: dbOrderId,
                    amount: orderData?.total || 0,
                    method: selectedMethod,
                    status: selectedMethod === 'cash_on_delivery' ? 'pending' : 'pending_confirmation',
                    currency: selectedCurrency,
                    transaction_phone: transactionDetails.phone || null,
                    transaction_code: transactionDetails.code || null
                };

                const { error: paymentError } = await supabase
                    .from('payments')
                    .insert([paymentPayload]);

                if (paymentError) throw paymentError;
            }

            clearCart();
            setIsOrderPlaced(true);

        } catch (err) {
            console.error("Erreur commande:", err);
            setError("Erreur lors de la validation: " + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // --- Rendu de la Page ---

    if (isOrderPlaced) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="bg-white rounded-2xl p-10 w-full max-w-lg text-center shadow-xl">
                    <FaCircleCheck className="text-6xl text-green-500 mx-auto mb-6" /> 
                    <h2 className="text-3xl font-bold mb-4 text-gray-800">
                        Commande Placée avec Succès !
                    </h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Votre commande a été enregistrée. Total: <strong>{formatPrice(totalSelectedCurrency)}</strong>
                    </p>
                    <Link
                        href="/orders"
                        className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold inline-flex items-center hover:bg-blue-700 transition"
                    >
                        Voir mes commandes <FaArrowRight className="ml-2" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-extrabold mb-8 text-gray-800 flex items-center">
                    <FaLock className="mr-3 text-orange-500" /> Finalisation de la Commande
                </h1>

                <form onSubmit={handleOtherPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne Gauche et Milieu: Adresse, livreur et paiement */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Section 1: Adresse de livraison */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-blue-600">1. Adresse de Livraison</h2>
                            <div className="space-y-4">
                                <input type="text" placeholder="Rue, Quartier et Numéro de Maison" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                                <input type="text" placeholder="Ville" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                                <input type="tel" placeholder="Téléphone pour la livraison" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
                                <div className="flex items-center text-sm text-gray-600"><FaLocationDot className="mr-2 text-green-500" />Votre adresse est sécurisée et utilisée uniquement pour la livraison.</div>
                            </div>
                        </div>

                        {/* Section 2: Choix du livreur */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-blue-600 flex items-center gap-2">
                                <FaTruck className="text-orange-500" />
                                2. Choix du livreur
                            </h2>
                            
                            {delivererError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                                    {delivererError}
                                </div>
                            )}

                            {delivererLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <FaSpinner className="animate-spin text-2xl text-blue-600 mr-3" />
                                    <span className="text-gray-600">Chargement des livreurs disponibles...</span>
                                </div>
                            ) : deliverers.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg">
                                    <FaTruck className="text-4xl text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">Aucun livreur disponible pour le moment.</p>
                                    <p className="text-sm text-gray-500 mt-2">Veuillez réessayer plus tard.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {deliverers.map((deliverer) => (
                                        <DelivererOption
                                            key={deliverer.id}
                                            deliverer={deliverer}
                                            selected={selectedDeliverer === deliverer.id}
                                            onSelect={handleDelivererSelect}
                                            loading={loading}
                                        />
                                    ))}
                                </div>
                            )}
                            
                            {!isDelivererSelected && !delivererLoading && deliverers.length > 0 && (
                                <p className="text-sm text-orange-600 mt-3 flex items-center gap-2">
                                    <FaSpinner className="animate-spin" />
                                    Veuillez choisir un livreur pour continuer
                                </p>
                            )}
                        </div>

                        {/* Section 3: Méthode de paiement */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <h2 className="text-2xl font-bold mb-6 border-b pb-3 text-blue-600">3. Méthode de paiement</h2>
                            {error && <p className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">{error}</p>}
                            <div className="space-y-4">
                                <PaymentOption 
                                    icon={FaMoneyBillWave} 
                                    title="Paiement à la Livraison" 
                                    description={`Payer ${formatPrice(totalSelectedCurrency)} à la réception`} 
                                    method="cash_on_delivery" 
                                    selected={selectedMethod === 'cash_on_delivery'} 
                                    onClick={() => setSelectedMethod('cash_on_delivery')} 
                                />
                                
                                <PaymentOption 
                                    icon={FaMobile} 
                                    title="Mobile Money (Orange, MTN, Moov...)" 
                                    description={`Montant à transférer : ${formatPrice(totalSelectedCurrency)}`} 
                                    method="transfer_mobile" 
                                    selected={selectedMethod === 'transfer_mobile'} 
                                    onClick={() => setSelectedMethod('transfer_mobile')} 
                                />
                                
                                {selectedMethod.startsWith('transfer_') && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mt-4 space-y-3">
                                        <p className="font-semibold text-yellow-800">Détails du Transfert</p>
                                        <input 
                                            type="tel" 
                                            placeholder="Numéro de téléphone utilisé pour le transfert" 
                                            value={transactionDetails.phone} 
                                            onChange={e => setTransactionDetails({ ...transactionDetails, phone: e.target.value })} 
                                            className="w-full p-3 border border-gray-300 rounded-lg" 
                                            required 
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Code/ID de transaction (Requis)" 
                                            value={transactionDetails.code} 
                                            onChange={e => setTransactionDetails({ ...transactionDetails, code: e.target.value })} 
                                            className="w-full p-3 border border-gray-300 rounded-lg" 
                                            required 
                                        />
                                    </div>
                                )}
                                
                                <PaymentOption 
                                    icon={FaPaypal} 
                                    title="PayPal / Carte Bancaire" 
                                    description={`Paiement sécurisé via PayPal. Montant converti en USD (${totalUSDString} USD)`} 
                                    method="paypal" 
                                    selected={selectedMethod === 'paypal'} 
                                    onClick={() => setSelectedMethod('paypal')} 
                                />
                                
                                {selectedMethod === 'paypal' && (
                                    <div className="mt-4">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                                            <p className="text-blue-800 font-medium">
                                                Montant PayPal: <strong>{totalUSDString} USD</strong>
                                                {selectedCurrency !== 'USD' && (
                                                    <span className="text-sm text-gray-600 block">
                                                        (équivalent à {formatPrice(totalSelectedCurrency)})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <PayPalPaymentButton 
                                            amount={totalUSDString} 
                                            currency="USD" 
                                            onCreateOrder={createPayPalOrder} 
                                            onApprove={onPayPalApprove} 
                                            onError={onPayPalError} 
                                            disabled={!isAddressValid || loading || !isDelivererSelected} 
                                        />
                                        {(!isAddressValid || !isDelivererSelected) && (
                                            <p className="text-sm text-orange-600 mt-2">
                                                Veuillez d'abord remplir votre adresse et choisir un livreur.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Colonne Droite : Récapitulatif */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-xl sticky top-4">
                            <h2 className="text-2xl font-bold mb-4 border-b pb-3 text-gray-800">Récapitulatif</h2>
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm text-gray-700">
                                        <span className="truncate pr-2">{item.quantity} x {item.name}</span>
                                        <span className="font-medium text-right">{formatPrice((item.price || item.prix) * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t mt-4 pt-4 space-y-2">
                                <div className="flex justify-between text-lg">
                                    <span>Sous-total :</span>
                                    <span className="font-semibold">{formatPrice(total)}</span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span>Frais plateforme :</span>
                                    <span className="font-semibold text-green-600">{formatPrice(shippingFeeXOF)}</span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span>Frais livreur :</span>
                                    <span className="font-semibold text-orange-600">{formatPrice(selectedDelivererFee)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between text-2xl pt-3 font-extrabold border-t mt-3 text-orange-500">
                                <span>TOTAL :</span>
                                <span>{formatPrice(totalSelectedCurrency)}</span>
                            </div>
                            
                            {/* Informations du livreur sélectionné */}
                            {isDelivererSelected && (
                                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <p className="font-semibold text-orange-800 text-sm mb-1">Livreur sélectionné :</p>
                                    <p className="text-orange-700 text-sm">
                                        {deliverers.find(d => d.id === selectedDeliverer)?.name}
                                    </p>
                                </div>
                            )}

                            {/* Bouton pour les autres méthodes de paiement */}
                            {selectedMethod !== 'paypal' && (
                                <button 
                                    type="submit" 
                                    disabled={loading || cart.length === 0 || !isDelivererSelected} 
                                    className="w-full mt-6 px-8 py-4 rounded-full font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <><FaSpinner className="animate-spin mr-3" />Traitement...</>
                                    ) : (
                                        `Confirmer et Payer ${formatPrice(totalSelectedCurrency)}`
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}