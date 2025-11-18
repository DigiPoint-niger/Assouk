import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const { orderID } = await request.json();

    if (!orderID) {
      return NextResponse.json(
        { error: "orderID est requis" },
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

    // Obtenir le token d'accès
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

    // Capturer le paiement
    const captureResponse = await fetch(
      `${paypalApiUrl}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const captureData = await captureResponse.json();
    
    if (!captureResponse.ok) {
      throw new Error(`Capture error: ${captureData.message}`);
    }

    // Si la capture est réussie, mettre à jour les commandes
    if (captureData.status === 'COMPLETED') {
      const supabase = createServerClient();
      const orderIds = captureData.purchase_units?.[0]?.custom_id?.split(',') || [];

      for (const orderId of orderIds) {
        const trimmedId = orderId.trim();
        
        // Mettre à jour le statut de paiement
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            status: 'confirmed'
          })
          .eq('id', trimmedId);

        if (updateError) {
          console.error(`Erreur mise à jour commande ${trimmedId}:`, updateError);
          // Continuer même si une commande échoue
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      status: captureData.status
    });

  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur PayPal' },
      { status: 500 }
    );
  }
}