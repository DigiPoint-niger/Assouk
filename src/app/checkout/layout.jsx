"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const initialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  currency: "EUR",
  intent: "capture",
  // Ajoutez ces options pour le débogage
  debug: true,
  components: "buttons",
  // Forcer le charment en utilisant le bon environnement
  "data-sdk-integration-source": "developer-studio"
};

export default function CheckoutLayout({ children }) {
  return (
    <PayPalScriptProvider 
      options={initialOptions}
      deferLoading={false} // Charge immédiatement
    >
      {children}
    </PayPalScriptProvider>
  );
}