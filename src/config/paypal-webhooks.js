/**
 * Configuration Webhooks PayPal - ASSOUK
 * 
 * Les webhooks PayPal permettent à PayPal de notifier votre serveur
 * en temps réel des changements d'état de paiement.
 * 
 * IMPORTANT: À configurer dans le Dashboard PayPal
 * https://developer.paypal.com/dashboard/webhooks
 */

/**
 * Configuration du Webhook
 * Ces événements doivent être activés dans le Dashboard PayPal
 */
export const WEBHOOK_EVENTS = {
  // Paiements
  CHECKOUT_ORDER_APPROVED: 'CHECKOUT.ORDER.APPROVED',
  CHECKOUT_ORDER_COMPLETED: 'CHECKOUT.ORDER.COMPLETED',
  PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_DENIED: 'PAYMENT.CAPTURE.DENIED',
  PAYMENT_CAPTURE_PENDING: 'PAYMENT.CAPTURE.PENDING',
  PAYMENT_CAPTURE_REFUNDED: 'PAYMENT.CAPTURE.REFUNDED',
  
  // Disputés
  CUSTOMER_DISPUTE_CREATED: 'CUSTOMER.DISPUTE.CREATED',
  CUSTOMER_DISPUTE_RESOLVED: 'CUSTOMER.DISPUTE.RESOLVED'
};

/**
 * Configuration recommandée de l'endpoint Webhook
 * À configurer dans le Dashboard PayPal
 */
export const WEBHOOK_CONFIG = {
  // Endpoint où PayPal envoie les notifications
  url: 'https://votre-domaine.com/api/paypal/webhook',
  
  // Événements à écouter
  events: [
    WEBHOOK_EVENTS.PAYMENT_CAPTURE_COMPLETED,
    WEBHOOK_EVENTS.PAYMENT_CAPTURE_DENIED,
    WEBHOOK_EVENTS.PAYMENT_CAPTURE_REFUNDED,
    WEBHOOK_EVENTS.CUSTOMER_DISPUTE_CREATED
  ],
  
  // Configuration recommandée
  retry_attempts: 3,
  retry_delay: 300000 // 5 minutes
};

/**
 * Structure d'un événement PayPal Webhook
 */
export const WEBHOOK_EVENT_STRUCTURE = {
  // Exemple d'événement PAYMENT.CAPTURE.COMPLETED
  example_payment_completed: {
    id: "WH-123456789...",
    event_version: "1.0",
    create_time: "2025-11-12T10:30:00.000Z",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "47122207FX..." , // ID de capture PayPal
      status: "COMPLETED",
      amount: {
        currency_code: "USD",
        value: "29.99"
      },
      supplementary_data: {
        related_ids: {
          order_id: "5O190127519343011" // Notre order_id stocké en custom_id
        }
      }
    }
  }
};

/**
 * Route à créer: src/app/api/paypal/webhook/route.js
 * 
 * Cette route reçoit les événements PayPal et met à jour la base de données
 */
export const WEBHOOK_ROUTE_CODE = `
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

// Clé secrète du webhook (à stocker en variable d'environnement)
const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * Vérifie la signature du webhook PayPal
 * Important pour confirmer que le webhook vient bien de PayPal
 */
async function verifyWebhookSignature(request, headers) {
  // Implémentation de la vérification de signature
  // Documentation: https://developer.paypal.com/docs/api/webhooks/v1/
  return true; // TODO: Implémenter la vérification
}

export async function POST(request) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers);

    console.log('Webhook PayPal reçu:', body.event_type);

    // Vérifier la signature du webhook
    const isValid = await verifyWebhookSignature(request, headers);
    if (!isValid) {
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Gérer les différents types d'événements
    switch (body.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        return await handlePaymentCompleted(body, supabase);
      
      case 'PAYMENT.CAPTURE.DENIED':
        return await handlePaymentDenied(body, supabase);
      
      case 'PAYMENT.CAPTURE.REFUNDED':
        return await handlePaymentRefunded(body, supabase);
      
      case 'CUSTOMER.DISPUTE.CREATED':
        return await handleDisputeCreated(body, supabase);
      
      default:
        console.log('Événement non géré:', body.event_type);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Erreur webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Gère un paiement complété
 */
async function handlePaymentCompleted(body, supabase) {
  const paypalOrderId = body.resource.supplementary_data?.related_ids?.order_id;
  const amount = body.resource.amount.value;
  const currency = body.resource.amount.currency_code;

  console.log('Paiement complété:', { paypalOrderId, amount, currency });

  // Mettre à jour la commande
  // (On l'a déjà fait au moment de la capture, c'est une confirmation)

  return NextResponse.json({ received: true });
}

/**
 * Gère un paiement refusé
 */
async function handlePaymentDenied(body, supabase) {
  const paypalOrderId = body.resource.supplementary_data?.related_ids?.order_id;
  const reason = body.resource.status_reason;

  console.log('Paiement refusé:', { paypalOrderId, reason });

  // Marquer la commande comme échouée
  // TODO: Implémenter

  return NextResponse.json({ received: true });
}

/**
 * Gère un remboursement
 */
async function handlePaymentRefunded(body, supabase) {
  const paypalOrderId = body.resource.supplementary_data?.related_ids?.order_id;
  const refundAmount = body.resource.amount.value;

  console.log('Remboursement:', { paypalOrderId, refundAmount });

  // Créer une transaction de remboursement
  // TODO: Implémenter

  return NextResponse.json({ received: true });
}

/**
 * Gère un litige/dispute
 */
async function handleDisputeCreated(body, supabase) {
  const disputeId = body.resource.id;
  const amount = body.resource.amount.value;

  console.log('Litige créé:', { disputeId, amount });

  // Alerter le support
  // TODO: Implémenter

  return NextResponse.json({ received: true });
}
`;

/**
 * Instructions pour configurer les webhooks
 */
export const WEBHOOK_SETUP_GUIDE = `
# CONFIGURATION DES WEBHOOKS PAYPAL

## Étape 1: Accéder au Dashboard PayPal Developer

1. Aller à https://developer.paypal.com/dashboard
2. Se connecter avec le compte développeur
3. Aller à "Apps & Credentials"
4. S'assurer que le mode "Sandbox" est sélectionné

## Étape 2: Créer l'endpoint Webhook

1. Aller à "Webhooks" dans le menu principal
2. Cliquer "Create Webhook"
3. Entrer l'URL: https://votre-domaine.com/api/paypal/webhook
4. Sélectionner les événements (voir WEBHOOK_EVENTS dans ce fichier)
5. Cliquer "Create"

## Étape 3: Obtenir l'ID du Webhook

Après création, PayPal affiche l'ID du webhook.
À copier dans la variable d'environnement PAYPAL_WEBHOOK_ID

## Étape 4: Stocker les Secrets

Ajouter à .env.local:
\`\`\`
PAYPAL_WEBHOOK_ID=WH_xxxxxxxxxxxx
\`\`\`

## Étape 5: Implémenter la Route Webhook

Créer le fichier \`src/app/api/paypal/webhook/route.js\`
Utiliser le code dans WEBHOOK_ROUTE_CODE

## Étape 6: Tester

1. Utiliser l'outil "Send Test Webhook" dans PayPal Dashboard
2. Vérifier que votre serveur reçoit les événements
3. Vérifier les logs de votre application

## Événements Importants

### PAYMENT.CAPTURE.COMPLETED
- ✓ Le paiement est confirmé
- ✓ Mettre à jour la commande en 'confirmed'
- ✓ Distribuer les fonds au vendeur

### PAYMENT.CAPTURE.DENIED
- ✗ Le paiement a échoué
- ✗ Mettre à jour la commande en 'failed'
- ✗ Notifier le client

### PAYMENT.CAPTURE.REFUNDED
- ↩ Un remboursement a eu lieu
- ↩ Créer une transaction de remboursement
- ↩ Notifier les vendeurs

### CUSTOMER.DISPUTE.CREATED
- ⚠ Un litige a été créé par l'acheteur
- ⚠ Alerter le support
- ⚠ Geler les fonds du vendeur

## Sécurité

✓ Vérifier TOUJOURS la signature du webhook
✓ Ne pas faire confiance aux données du client
✓ Idempotence: une requête dupliquée ne doit pas causer de problème
✓ Stocker les IDs de webhook traités pour éviter les doublons
`;

/**
 * Exemple d'événement PayPal
 */
export const EXAMPLE_WEBHOOK_EVENTS = {
  payment_completed: {
    id: "WH-7A48044954957143K",
    event_version: "1.0",
    create_time: "2025-11-12T10:30:00.000Z",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "47122207FX123456",
      status: "COMPLETED",
      amount: {
        currency_code: "USD",
        value: "29.99"
      },
      supplementary_data: {
        related_ids: {
          order_id: "5O190127519343011"
        }
      },
      seller_receivable_breakdown: {
        gross_amount: {
          currency_code: "USD",
          value: "29.99"
        },
        paypal_fee: {
          currency_code: "USD",
          value: "1.04"
        },
        net_amount: {
          currency_code: "USD",
          value: "28.95"
        }
      }
    },
    links: [
      {
        rel: "self",
        href: "https://api.paypal.com/v1/notifications/webhooks-events/WH-7A48044954957143K"
      },
      {
        rel: "resend",
        href: "https://api.paypal.com/v1/notifications/webhooks-events/WH-7A48044954957143K/resend"
      }
    ]
  }
};

export default {
  events: WEBHOOK_EVENTS,
  config: WEBHOOK_CONFIG,
  setupGuide: WEBHOOK_SETUP_GUIDE,
  exampleEvents: EXAMPLE_WEBHOOK_EVENTS
};
