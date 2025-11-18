"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import CurrencySelector from './CurrencySelector';

export default function Navbar() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo_assouk.png" alt="ASSOUK" width={40} height={40} />
          <div className="font-bold">ASSOUK</div>
        </Link>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-4">
          {!user && (
            <>
              <Link href="/marketplace" className="text-sm">Marketplace</Link>
              <Link href="/cart" className="text-sm">Panier</Link>
              <Link href="/login" className="text-sm">Se connecter</Link>
              <Link href="/signup" className="text-sm btn-primary px-3 py-1 rounded">S'inscrire</Link>
              <CurrencySelector />
            </>
          )}
          {user && (
            <>
              <Link href="/dashboard" className="text-sm">Dashboard</Link>
              <Link href="/marketplace" className="text-sm">Marketplace</Link>
              <Link href="/sellers" className="text-sm">Vendeurs</Link>
              <Link href="/cart" className="text-sm">Panier</Link>
              <Link href="/messages" className="text-sm">Messagerie</Link>
              <button onClick={handleLogout} className="text-sm text-red-600">Déconnexion</button>
              <CurrencySelector />
            </>
          )}
        </div>

        {/* Menu mobile toggle */}
        <div className="md:hidden">
          <button onClick={() => setOpen(!open)} className="p-2">
            ☰
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col space-y-2">
          {!user && (
            <>
              <Link href="/marketplace" className="block py-2">Marketplace</Link>
              <Link href="/cart" className="block py-2">Panier</Link>
              <Link href="/login" className="block py-2">Se connecter</Link>
              <Link href="/signup" className="block py-2">S'inscrire</Link>
              <CurrencySelector />
            </>
          )}
          {user && (
            <>
              <Link href="/dashboard" className="block py-2">Dashboard</Link>
              <Link href="/marketplace" className="block py-2">Marketplace</Link>
              <Link href="/sellers" className="block py-2">Vendeurs</Link>
              <Link href="/cart" className="block py-2">Panier</Link>
              <Link href="/messages" className="block py-2">Messagerie</Link>
              <button onClick={handleLogout} className="block py-2 text-left text-red-600">Déconnexion</button>
              <CurrencySelector />
            </>
          )}
          
        </div>
      )}
    </nav>
  );
}
