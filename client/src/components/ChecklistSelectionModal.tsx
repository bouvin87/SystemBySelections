import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search } from "lucide-react";
import { renderIcon } from "@/lib/icon-utils";
import type { Checklist } from "@shared/schema";

interface ChecklistSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChecklist: (checklistId: number) => void;
}

export default function ChecklistSelectionModal({
  isOpen,
  onClose,
  onSelectChecklist,
}: ChecklistSelectionModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allChecklists = [], isLoading } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists/all-active"],
    enabled: isOpen,
  });

  const filteredChecklists = allChecklists.filter((checklist) =>
    checklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (checklist.description && checklist.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectChecklist = (checklistId: number) => {
    onSelectChecklist(checklistId);
    onClose();
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t('navigation.selectChecklist')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('navigation.searchChecklists')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Checklist List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <p>{t('common.loading')}</p>
              </div>
            ) : filteredChecklists.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? t('navigation.noChecklistsFound') : t('navigation.noChecklistsAvailable')}
                </p>
              </div>
            ) : (
              filteredChecklists.map((checklist) => (
                <Card 
                  key={checklist.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSelectChecklist(checklist.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {renderIcon(checklist.icon, "h-5 w-5")}
                      {checklist.name}
                    </CardTitle>
                    {checklist.description && (
                      <CardDescription className="text-sm">
                        {checklist.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {checklist.includeWorkTasks && (
                          <span>{t('common.includesWorkTasks')}</span>
                        )}
                        {checklist.includeWorkStations && (
                          <span>{t('common.includesWorkStations')}</span>
                        )}
                        {checklist.includeShifts && (
                          <span>{t('common.includesShifts')}</span>
                        )}
                      </div>
                      <Button size="sm">
                        {t('navigation.startChecklist')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}