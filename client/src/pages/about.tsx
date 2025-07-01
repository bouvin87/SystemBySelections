import Navigation from "@/components/Navigation";
import { Building2, CheckSquare, AlertTriangle, BarChart3 } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <main className="max-w-md mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System by Selection</h1>
            <p className="text-sm text-gray-500">Version 1.0.0</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            System by Selection är en modern webbapplikation för produktionsloggning 
            och kvalitetshantering, särskilt utvecklad för svenska tillverkningsföretag.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Funktioner</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckSquare className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Checklistor</h3>
                <p className="text-sm text-gray-600">
                  Dynamiska formulär för kvalitetskontroller och produktionsloggning
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Avvikelsehantering</h3>
                <p className="text-sm text-gray-600">
                  Rapportera, spåra och hantera avvikelser i produktionsprocessen
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Analys & Rapporter</h3>
                <p className="text-sm text-gray-600">
                  Visualisering av data och trender för kontinuerlig förbättring
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Teknisk information</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Frontend:</span>
              <span>React + TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span>Backend:</span>
              <span>Node.js + Express</span>
            </div>
            <div className="flex justify-between">
              <span>Databas:</span>
              <span>PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>Plattform:</span>
              <span>Replit</span>
            </div>
          </div>
        </div>

        {/* Contact/Support */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Support</h2>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              För support och frågor, kontakta din systemadministratör eller 
              använd funktionen "Vanliga frågor" i appen.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            <p>© 2024 System by Selection</p>
            <p>Alla rättigheter förbehållna</p>
          </div>
        </div>
      </main>
    </div>
  );
}