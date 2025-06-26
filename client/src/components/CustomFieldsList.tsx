import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { CustomFieldModal } from './CustomFieldModal';
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

  const { data: customFields = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/custom-fields'],
  });

  const { data: deviationTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['/api/deviations/types'],
    queryFn: () => fetch('/api/deviations/types').then(res => res.json()),
  });

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
        description: `Fältet "${field.name}" har tagits bort framgångsrikt.`,
      });
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: 'Fel',
        description: 'Det gick inte att ta bort extrafältet. Försök igen.',
        variant: 'destructive',
      });
    }
  };

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      number: 'Nummer',
      checkbox: 'Checkbox',
      date: 'Datum',
      select: 'Val'
    };
    return labels[type] || type;
  };

  if (fieldsLoading || typesLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Laddar extrafält...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Extrafält för avvikelser
            </CardTitle>
            <Button onClick={handleCreate} size="sm">
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
              <p className="text-sm">Skapa ditt första extrafält för att komma igång.</p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Skapa extrafält
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {(Array.isArray(customFields) ? customFields : [])
                .sort((a: CustomField, b: CustomField) => a.order - b.order)
                .map((field: CustomField) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{field.name}</h3>
                        <Badge variant="secondary">
                          {getFieldTypeLabel(field.fieldType)}
                        </Badge>
                        {field.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Obligatorisk
                          </Badge>
                        )}
                      </div>
                      
                      {field.options && field.options.length > 0 && (
                        <div className="text-sm text-gray-600 mb-2">
                          Alternativ: {field.options.join(', ')}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        Ordning: {field.order}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(field)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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