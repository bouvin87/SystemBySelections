import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { CustomField, DeviationType } from '@shared/schema';

interface CustomFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field?: CustomField;
  deviationTypes: DeviationType[];
}

export function CustomFieldModal({ 
  open, 
  onOpenChange, 
  field, 
  deviationTypes 
}: CustomFieldModalProps) {
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [isRequired, setIsRequired] = useState(false);
  const [order, setOrder] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [linkedTypes, setLinkedTypes] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (field) {
      setName(field.name);
      setFieldType(field.fieldType);
      setIsRequired(field.isRequired);
      setOrder(field.order);
      setOptions(field.options || []);
      
      // Fetch linked deviation types for this field
      if (field.id) {
        fetchLinkedTypes(field.id);
      }
    } else {
      resetForm();
    }
  }, [field, open]);

  const resetForm = () => {
    setName('');
    setFieldType('text');
    setIsRequired(false);
    setOrder(0);
    setOptions([]);
    setNewOption('');
    setLinkedTypes([]);
  };

  const fetchLinkedTypes = async (fieldId: number) => {
    try {
      const response = await fetch(`/api/custom-fields/${fieldId}/deviation-types`);
      if (response.ok) {
        const types = await response.json();
        setLinkedTypes(types.map((t: DeviationType) => t.id));
      }
    } catch (error) {
      console.error('Error fetching linked types:', error);
    }
  };

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const fieldData = {
        name,
        fieldType,
        isRequired,
        order,
        options: fieldType === 'select' ? options : undefined,
      };

      let savedField;
      if (field?.id) {
        // Update existing field
        savedField = await apiRequest({
          endpoint: `/api/custom-fields/${field.id}`,
          method: 'PATCH',
          data: fieldData,
        });
      } else {
        // Create new field
        savedField = await apiRequest({
          endpoint: '/api/custom-fields',
          method: 'POST',
          data: fieldData,
        });
      }

      // Update linked deviation types
      const fieldId = (savedField as any)?.id || field?.id;
      if (fieldId) {
        // Get current mappings
        const currentMappingsResponse = await fetch(`/api/custom-fields/${fieldId}/deviation-types`);
        const currentMappings = currentMappingsResponse.ok ? await currentMappingsResponse.json() : [];
        const currentTypeIds = currentMappings.map((t: DeviationType) => t.id);

        // Remove old mappings
        for (const typeId of currentTypeIds) {
          if (!linkedTypes.includes(typeId)) {
            await apiRequest({
              endpoint: `/api/custom-fields/${fieldId}/deviation-types/${typeId}`,
              method: 'DELETE',
            });
          }
        }

        // Add new mappings
        for (const typeId of linkedTypes) {
          if (!currentTypeIds.includes(typeId)) {
            await apiRequest({
              endpoint: `/api/custom-fields/${fieldId}/deviation-types/${typeId}`,
              method: 'POST',
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deviation-types'] });
      
      toast({
        title: field ? 'Extrafält uppdaterat' : 'Extrafält skapat',
        description: `Fältet "${name}" har ${field ? 'uppdaterats' : 'skapats'} framgångsrikt.`,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving custom field:', error);
      toast({
        title: 'Fel',
        description: 'Det gick inte att spara extrafältet. Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeToggle = (typeId: number) => {
    setLinkedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {field ? 'Redigera extrafält' : 'Skapa nytt extrafält'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="T.ex. Serienummer, Kontaktperson..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldType">Fälttyp</Label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Nummer</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="date">Datum</SelectItem>
                  <SelectItem value="select">Val (dropdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order">Ordning</Label>
              <Input
                id="order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="isRequired"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked === true)}
              />
              <Label htmlFor="isRequired">Obligatoriskt fält</Label>
            </div>
          </div>

          {fieldType === 'select' && (
            <div className="space-y-2">
              <Label>Alternativ</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Lägg till alternativ..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  />
                  <Button type="button" onClick={addOption} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{option}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Koppla till ärendetyper</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
              {deviationTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={linkedTypes.includes(type.id)}
                    onCheckedChange={() => handleTypeToggle(type.id)}
                  />
                  <Label 
                    htmlFor={`type-${type.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {type.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sparar...' : field ? 'Uppdatera' : 'Skapa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}