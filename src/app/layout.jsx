// Fichier : app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { createServerClient } from "@/lib/supabaseServer";
import PlatformMaintenance from "@/components/PlatformMaintenance";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ASSOUK",
  description: "Le marché au porté des doigts de tous vos besoins. Achetez, vendez, livrez !",
};

async function getPlatformSettings() {
  try {
    const supabase = createServerClient();
    
    const { data: settingsData, error } = await supabase
      .from('platform_settings')
      .select('*');

    if (error) throw error;

    const settings = {};
    if (settingsData) {
      settingsData.forEach(setting => {
        if (setting.value === 'true' || setting.value === 'false') {
          settings[setting.key] = setting.value === 'true';
        } else {
          settings[setting.key] = setting.value;
        }
      });
    }

    return settings;
  } catch (error) {
    //console.error('Erreur lors du chargement des paramètres:', error);
    return {
      platform_enabled: true,
      seller_registration_enabled: true,
      deliverer_registration_enabled: true,
      client_registration_enabled: true,
      default_currency: 'XOF'
    };
  }
}

export default async function RootLayout({ children }) {
  const settings = await getPlatformSettings();
  const isPlatformEnabled = settings.platform_enabled;

  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <CurrencyProvider>
            {isPlatformEnabled ? (
              <>
                <Navbar />
                <CartProvider>
                  {children}
                </CartProvider>
                <Footer />
              </>
            ) : (
              <PlatformMaintenance />
            )}
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}