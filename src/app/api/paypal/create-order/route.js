import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const { amount, currency, orderIds } = await request.json();

    if (!amount || !currency || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "Les paramètres amount, currency et orderIds sont requis" },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalApiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Configuration PayPal manquante" },
        { status: 500 }
      );
    }

    // Valider que les commandes existent et que le total correspond
    const supabase = createServerClient();
    
    let validatedTotal = 0;
    for (const orderId of orderIds) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('total, currency, payment_status')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: `Commande ${orderId} non trouvée` },
          { status: 404 }
        );
      }

      // Vérifier que le paiement n'a pas déjà été traité
      if (order.payment_status === 'completed') {
        return NextResponse.json(
          { error: `Commande ${orderId} déjà payée` },
          { status: 400 }
        );
      }

      // Vérifier que la devise correspond
      if (order.currency !== currency) {
        return NextResponse.json(
          { error: `Devise incohérente pour la commande ${orderId}` },
          { status: 400 }
        );
      }

      validatedTotal += parseFloat(order.total);
    }

    // Vérifier que le montant soumis correspond au total des commandes
    const submittedAmount = parseFloat(amount);
    if (Math.abs(validatedTotal - submittedAmount) > 0.01) { // 0.01 pour les arrondis
      return NextResponse.json(
        { error: `Montant invalide. Attendu: ${validatedTotal}, reçu: ${submittedAmount}` },
        { status: 400 }
      );
    }

    // Obtenir le token d'accès PayPal
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch(`${paypalApiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Token error: ${tokenData.error_description}`);
    }

    // Créer la commande PayPal
    const orderResponse = await fetch(`${paypalApiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: orderIds.join(','), // Stocker les IDs des commandes
          description: `Commandes #${orderIds.slice(0, 3).join(', ')}${orderIds.length > 3 ? '...' : ''}`,
          amount: {
            currency_code: currency,
            value: amount,
          },
        }],
      }),
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok) {
      throw new Error(`PayPal error: ${orderData.message}`);
    }


    // Envoi notification Telegram
    try {
      const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/telegram/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🛒 Nouvelle commande passée !\nID(s): ${orderIds.join(', ')}\nMontant: ${amount} ${currency}`
        })
      });
      // Optionnel: log ou gestion d'erreur
      if (!notifyRes.ok) {
        console.error('Erreur notification Telegram:', await notifyRes.text());
      }
    } catch (err) {
      console.error('Erreur notification Telegram:', err);
    }

    return NextResponse.json({ id: orderData.id });

  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur PayPal' },
      { status: 500 }
    );
  }
}
