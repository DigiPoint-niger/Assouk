// Fichier : src/app/checkout/success/page.jsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCircleCheck, FaSpinner, FaArrowRight } from "react-icons/fa6";
import { supabase } from "@/lib/supabase"; // Assurez-vous que le chemin est correct
import { useCurrency } from "@/context/CurrencyContext";

export default function SuccessPage() {
    return (
        <Suspense>
            <SuccessPageContent />
        </Suspense>
    );
}

function SuccessPageContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading');
    const [orderInfo, setOrderInfo] = useState(null);
    const { formatPrice } = useCurrency();

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            return;
        }

        const fetchOrderDetails = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error || !data) {
                console.error("Erreur lors de la récupération de la commande:", error);
                setStatus('error');
                return;
            }

            setOrderInfo(data);

            if (data.payment_status === 'completed') {
                setStatus('success');
            } else {
                setStatus('success');
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    const getStatusContent = () => {
        if (status === 'loading') {
            return (
                <>
                    <FaSpinner className="text-6xl text-[var(--company-blue)] mx-auto mb-6 animate-spin" />
                    <h2 className="text-3xl font-bold mb-4 text-[var(--app-dark-blue)]">
                        Traitement du Paiement en Cours
                    </h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Veuillez patienter pendant la validation finale de votre paiement PayPal.
                    </p>
                </>
            );
        }

        if (status === 'success' && orderInfo) {
            return (
                <>
                    <FaCircleCheck className="text-6xl text-[var(--success)] mx-auto mb-6" /> 
                    <h2 className="text-3xl font-bold mb-4 text-[var(--app-dark-blue)]">
                        Paiement Réussi ! Commande Confirmée.
                    </h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Votre paiement a été reçu avec succès. La commande **#{orderInfo.id.substring(0, 8).toUpperCase()}** est en cours de préparation.
                        <br/>Total payé : **{formatPrice(orderInfo.total, orderInfo.currency)}**.
                    </p>
                </>
            );
        }

        if (status === 'error' || !orderInfo) {
            return (
                <>
                    <FaCircleCheck className="text-6xl text-red-500 mx-auto mb-6" /> 
                    <h2 className="text-3xl font-bold mb-4 text-red-700">
                        Erreur ou Commande Introuvable
                    </h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Nous n'avons pas pu confirmer votre commande. Si vous avez été débité, veuillez contacter notre support en mentionnant l'ID de commande : **{orderId || 'Non spécifié'}**.
                    </p>
                </>
            );
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="bg-white rounded-2xl p-10 w-full max-w-lg text-center shadow-2xl">
                {getStatusContent()}
                <Link
                    href="/orders"
                    className="btn-primary px-6 py-3 rounded-full font-bold inline-flex items-center hover:shadow-lg transition mt-4"
                >
                    Voir mes commandes <FaArrowRight className="ml-2" />
                </Link>
                <Link
                    href="/"
                    className="btn-secondary px-6 py-3 rounded-full font-bold inline-flex items-center hover:shadow-lg transition ml-3 mt-4"
                >
                    Retour à l'accueil
                </Link>
            </div>
        </main>
    );
}