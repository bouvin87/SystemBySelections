import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Link as LinkIcon,
  Filter,
  Calendar,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  examples?: string[];
}

export default function FAQ() {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const faqData: FAQItem[] = [
    {
      question: "Hur fungerar URL-filtrering i dashboard?",
      answer:
        "Du kan förinställa filter i dashboard genom att lägga till parametrar i URL:en. Detta gör det enkelt att dela specifika vyer eller skapa bokmärken för vanliga filter.",
      category: "Dashboard",
      examples: [
        "/checklist/4/dashboard?startDate=t&endDate=t-1",
        "/checklist/4/dashboard?workTaskId=1&search=operator",
        "/checklist/4/dashboard?startDate=t-7&endDate=t&shiftId=2",
      ],
    },
    {
      question: "Vad betyder 't', 't-1', 't-7' i datumfilter?",
      answer:
        "Dessa är relativa datum som gör det enkelt att filtrera på specifika tidsperioder utan att behöva ändra datum varje dag.",
      category: "Dashboard",
      examples: [
        "t = dagens datum",
        "t-1 = igår",
        "t-7 = en vecka sedan",
        "t+1 = imorgon",
        "t+7 = om en vecka",
      ],
    },
    {
      question: "Vilka URL-parametrar kan jag använda?",
      answer:
        "Du kan använda följande parametrar för att förinställa filter i dashboard:",
      category: "Dashboard",
      examples: [
        "startDate - startdatum (t, t-1, eller YYYY-MM-DD)",
        "endDate - slutdatum (t, t+1, eller YYYY-MM-DD)",
        "workTaskId - ID för arbetsmoment",
        "workStationId - ID för arbetsstation",
        "shiftId - ID för skift",
        "search - sökterm för operatör eller ID",
      ],
    },
    {
      question: "Hur kopplar jag frågor till specifika arbetsmoment?",
      answer:
        "I checklist-editorn kan du redigera varje fråga och välja vilka arbetsmoment som frågan ska visas för. Frågor utan kopplingar visas för alla arbetsmoment.",
      category: "Frågor",
      examples: [
        "Klicka på 'Redigera' vid frågan",
        "Välj 'Arbetsmoment för denna fråga'",
        "Markera relevanta arbetsmoment",
        "Spara ändringar",
      ],
    },
    {
      question:
        "Vad händer om jag inte väljer några arbetsmoment för en fråga?",
      answer:
        "Frågor utan specifika arbetsmoment-kopplingar visas alltid, oavsett vilket arbetsmoment operatören väljer i formuläret.",
      category: "Frågor",
    },
    {
      question: "Hur fungerar formulärnavigering?",
      answer:
        "Formuläret är uppdelat i steg där operatören först fyller i identifikation, sedan besvarar frågor kategori för kategori. Bara kategorier med relevanta frågor visas.",
      category: "Formulär",
      examples: [
        "Steg 1: Välj checklista",
        "Steg 2: Fyll i operatör, arbetsmoment, station och skift",
        "Steg 3+: Besvara frågor per kategori",
        "Sista steget: Granska och skicka",
      ],
    },
    {
      question: "Kan jag dela direktlänkar till filtrerade vyer?",
      answer:
        "Ja, URL:en uppdateras automatiskt när du ändrar filter. Du kan kopiera URL:en och dela med andra eller skapa bokmärken för vanliga filtervyer.",
      category: "Dashboard",
    },
    {
      question: "Vad är skillnaden mellan olika frågetyper?",
      answer: "Systemet stöder flera frågetyper för olika typer av data:",
      category: "Frågor",
      examples: [
        "Text - Fri text och kommentarer",
        "Tal - Numeriska värden",
        "Ja/Nej - Binära svar",
        "Check - Kryssrutor för verifiering",
        "Stjärnor - Betygsättning 1-5",
        "Datum - Datumväljare",
        "Fil - Filuppladdning",
      ],
    },
    {
      question: "Hur fungerar dashboard-statistik?",
      answer:
        "Dashboard visar sammanfattande statistik baserat på dina filter. Statistiken uppdateras automatiskt när du ändrar filter.",
      category: "Dashboard",
      examples: [
        "Totalt antal svar",
        "Senaste svar",
        "Frågestatistik",
        "Trender över tid",
      ],
    },
    {
      question: "Vad händer om jag ändrar en checklista som redan har svar?",
      answer:
        "Befintliga svar påverkas inte av ändringar i checklistan. Nya svar kommer att använda den uppdaterade versionen av checklistan.",
      category: "Administration",
    },
  ];

  const categories = Array.from(new Set(faqData.map((item) => item.category)));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tillbaka
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <HelpCircle className="h-8 w-8 text-blue-600" />
                  Vanliga frågor
                </h1>
                <p className="text-gray-600 mt-2">
                  Hitta svar på vanliga frågor om {t("common.applicationName")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Links */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              Snabblänkar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">
                  Dashboard med filter
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    •{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      /checklist/4/dashboard?startDate=t
                    </code>
                  </p>
                  <p>
                    •{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      /checklist/4/dashboard?startDate=t-7&endDate=t
                    </code>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Relativa datum</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    • <code className="bg-gray-100 px-2 py-1 rounded">t</code> =
                    idag
                  </p>
                  <p>
                    • <code className="bg-gray-100 px-2 py-1 rounded">t-1</code>{" "}
                    = igår
                  </p>
                  <p>
                    • <code className="bg-gray-100 px-2 py-1 rounded">t-7</code>{" "}
                    = en vecka sedan
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ by Category */}
        {categories.map((category) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category === "Dashboard" && (
                  <Filter className="h-5 w-5 text-green-600" />
                )}
                {category === "Frågor" && (
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                )}
                {category === "Formulär" && (
                  <Search className="h-5 w-5 text-purple-600" />
                )}
                {category === "Administration" && (
                  <Calendar className="h-5 w-5 text-orange-600" />
                )}
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqData
                  .filter((item) => item.category === category)
                  .map((item, index) => {
                    const itemId = `${category}-${index}`;
                    const isOpen = openItems.includes(itemId);

                    return (
                      <Collapsible key={itemId}>
                        <CollapsibleTrigger
                          onClick={() => toggleItem(itemId)}
                          className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <h3 className="font-medium text-gray-900 pr-4">
                            {item.question}
                          </h3>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-500 shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4">
                          <div className="pt-4 space-y-3">
                            <p className="text-gray-600 leading-relaxed">
                              {item.answer}
                            </p>
                            {item.examples && item.examples.length > 0 && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">
                                  {category === "Dashboard" &&
                                  item.question.includes("parametrar")
                                    ? "Tillgängliga parametrar:"
                                    : "Exempel:"}
                                </h4>
                                <ul className="space-y-1">
                                  {item.examples.map((example, idx) => (
                                    <li
                                      key={idx}
                                      className="text-blue-800 text-sm"
                                    >
                                      {example.includes("/checklist") ? (
                                        <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                                          {example}
                                        </code>
                                      ) : (
                                        <>• {example}</>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle>Behöver du mer hjälp?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Om du inte hittar svaret på din fråga här, kontakta din
              systemadministratör eller IT-support.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Teknisk information
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Systemversion: {t("common.applicationName")} v1.0</li>
                <li>• Stöd för moderna webbläsare</li>
                <li>• Optimerat för desktop och mobila enheter</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
