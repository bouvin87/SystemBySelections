import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { CustomFieldModal } from './CustomFieldModal'; // Behåll din import
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { CustomField, DeviationType } from '@shared/schema';

interface CustomFieldsListProps {
  className?: string;
}

export function CustomFieldsList({ className }: CustomFieldsListProps) {
  const [selectedField, setSelectedField] = useState<CustomField | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ----- INGA ÄNDRINGAR I DATAHÄMTNING -----
  const { data: customFields = [], isLoading: fieldsLoading } = useQuery<CustomField[]>({
    queryKey: ['/api/custom-fields'],
  });

  const { data: deviationTypes = [], isLoading: typesLoading } = useQuery<DeviationType[]>({
    queryKey: ['/api/deviations/types'],
  });

  // ----- INGA ÄNDRINGAR I FUNKTIONER -----
  const handleEdit = (field: CustomField) => {
    setSelectedField(field);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedField(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = async (field: CustomField) => {
    if (!confirm(`Är du säker på att du vill ta bort extrafältet "${field.name}"?`)) {
      return;
    }
    try {
      await apiRequest({
        endpoint: `/api/custom-fields/${field.id}`,
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields'] });
      toast({
        title: 'Extrafält borttaget',
        description: `Fältet "${field.name}" har tagits bort.`,
      });
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: 'Fel',
        description: 'Det gick inte att ta bort extrafältet.',
        variant: 'destructive',
      });
    }
  };

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      number: 'Nummer',
      checkbox: 'Kryssruta',
      date: 'Datum',
      select: 'Dropdown'
    };
    return labels[type] || type;
  };
  // ------------------------------------

  if (fieldsLoading || typesLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">Laddar extrafält...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          {/* FIX 1: Rubriken är nu responsiv */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Extrafält för avvikelser
            </CardTitle>
            <Button onClick={handleCreate} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nytt fält
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {customFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Inga extrafält definierade</p>
              <p className="text-sm">Klicka på knappen för att skapa ditt första extrafält.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {/* FIX 2: Hela list-elementet är omgjort för att matcha de andra flikarna */}
              {(Array.isArray(customFields) ? customFields : [])
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <Card key={field.id} className="bg-card border border-border shadow-xs rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Vänster sida: Information */}
                        <div>
                          <div className="font-medium">{field.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {`Typ: ${getFieldTypeLabel(field.fieldType)}`} • {field.isRequired ? 'Obligatorisk' : 'Valfri'} • {`Ordning: ${field.order}`}
                          </div>
                        </div>

                        {/* Höger sida: Knappar */}
                        <div className="flex space-x-2 self-end sm:self-center">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(field)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(field)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomFieldModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        field={selectedField}
        deviationTypes={deviationTypes}
      />
    </div>
  );
}