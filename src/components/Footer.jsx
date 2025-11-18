"use client";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t mt-12">
      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <Image src="/logo_digipoint.png" alt="ASSOUK" width={48} height={48} />
          <div>
            <Link href="https://digipoint-portfolio.netlify.app" target="_blank" rel="noopener noreferrer" className="flex flex-col">
              <div className="font-bold">ASSOUK</div>
              <div className="text-sm text-gray-500">© {new Date().getFullYear()} DigiPoint</div>
            </Link>
            
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Navigation</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><Link href="/marketplace">Marketplace</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Contact</h4>
          <div className="text-sm text-gray-600">Tabbilal.boutique@gmail.com</div>
          <div className="text-sm text-gray-600">+213 7 96 53 75 94</div>
        </div>
      </div>
    </footer>
  );
}
