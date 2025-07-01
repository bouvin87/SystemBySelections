import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { ClipboardList, AlertTriangle, BarChart3, Settings, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import FormModal from "@/components/FormModal";
import DeviationModal from "@/components/DeviationModal";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"], retry: false });

  const displayName = user?.firstName || "Användare";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <main className="max-w-md mx-auto px-4 pt-6 pb-24 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-sm">Hej {displayName},</p>
          <h1 className="text-3xl font-bold">1 234,00</h1>
          <p className="text-sm text-gray-500">SEK</p>
        </div>

        {/* Action Grid */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Vad vill du göra?</p>
          <div className="grid grid-cols-2 gap-4">
            <button className="rounded-xl bg-violet-50 p-4 text-left">
              <ArrowUpRight className="h-5 w-5 mb-2 text-violet-600" />
              <p className="font-medium text-sm">Skicka pengar</p>
              <p className="text-xs text-gray-500">Till bank, Swish eller konto</p>
            </button>

            <button className="rounded-xl bg-green-50 p-4 text-left">
              <ArrowDownLeft className="h-5 w-5 mb-2 text-green-600" />
              <p className="font-medium text-sm">Begär pengar</p>
              <p className="text-xs text-gray-500">Från andra användare</p>
            </button>

            <button className="rounded-xl bg-yellow-50 p-4 text-left">
              <Smartphone className="h-5 w-5 mb-2 text-yellow-600" />
              <p className="font-medium text-sm">Köp surf</p>
              <p className="text-xs text-gray-500">Ladda eller skicka data</p>
            </button>

            <button className="rounded-xl bg-gray-100 p-4 text-left">
              <Wallet className="h-5 w-5 mb-2 text-gray-600" />
              <p className="font-medium text-sm">Betala faktura</p>
              <p className="text-xs text-gray-500">Inga avgifter när du betalar</p>
            </button>
          </div>
        </div>

        {/* Favorite users */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Favoritanvändare</p>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center text-sm text-gray-500">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">+</div>
              <span className="text-xs mt-1">Lägg till</span>
            </div>
            <div className="flex flex-col items-center text-sm">
              <img src="https://i.pravatar.cc/48?img=1" alt="Grace" className="h-12 w-12 rounded-full" />
              <span className="text-xs mt-1">Grace L.</span>
            </div>
            <div className="flex flex-col items-center text-sm">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600">
                LA
              </div>
              <span className="text-xs mt-1">Lawrence A.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
