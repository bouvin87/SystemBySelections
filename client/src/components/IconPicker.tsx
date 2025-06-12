import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  Check, 
  CheckSquare, 
  ClipboardList, 
  FileText, 
  Settings, 
  Users, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity, 
  Zap, 
  Star, 
  Heart, 
  Smile, 
  ThumbsUp, 
  Award, 
  Shield, 
  Wrench, 
  Cog, 
  Factory, 
  Building, 
  Package, 
  Truck, 
  Clipboard,
  Search,
  Plus,
  X
} from "lucide-react";

const commonIcons = [
  { name: "Check", icon: Check, value: "Check" },
  { name: "CheckSquare", icon: CheckSquare, value: "CheckSquare" },
  { name: "ClipboardList", icon: ClipboardList, value: "ClipboardList" },
  { name: "Clipboard", icon: Clipboard, value: "Clipboard" },
  { name: "FileText", icon: FileText, value: "FileText" },
  { name: "Settings", icon: Settings, value: "Settings" },
  { name: "Users", icon: Users, value: "Users" },
  { name: "Calendar", icon: Calendar, value: "Calendar" },
  { name: "Clock", icon: Clock, value: "Clock" },
  { name: "Target", icon: Target, value: "Target" },
  { name: "TrendingUp", icon: TrendingUp, value: "TrendingUp" },
  { name: "BarChart3", icon: BarChart3, value: "BarChart3" },
  { name: "PieChart", icon: PieChart, value: "PieChart" },
  { name: "Activity", icon: Activity, value: "Activity" },
  { name: "Zap", icon: Zap, value: "Zap" },
  { name: "Star", icon: Star, value: "Star" },
  { name: "Heart", icon: Heart, value: "Heart" },
  { name: "Smile", icon: Smile, value: "Smile" },
  { name: "ThumbsUp", icon: ThumbsUp, value: "ThumbsUp" },
  { name: "Award", icon: Award, value: "Award" },
  { name: "Shield", icon: Shield, value: "Shield" },
  { name: "Wrench", icon: Wrench, value: "Wrench" },
  { name: "Cog", icon: Cog, value: "Cog" },
  { name: "Factory", icon: Factory, value: "Factory" },
  { name: "Building", icon: Building, value: "Building" },
  { name: "Package", icon: Package, value: "Package" },
  { name: "Truck", icon: Truck, value: "Truck" },
];

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function IconPicker({ value, onChange, placeholder = "Välj ikon" }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIcon = commonIcons.find(icon => icon.value === value);

  const filteredIcons = commonIcons.filter(icon =>
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>Ikon</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              {selectedIcon ? (
                <>
                  <selectedIcon.icon className="h-4 w-4" />
                  {selectedIcon.name}
                </>
              ) : (
                placeholder
              )}
            </div>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Sök ikoner..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Ingen ikon hittades.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value=""
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Ingen ikon
                </CommandItem>
                {filteredIcons.map((icon) => (
                  <CommandItem
                    key={icon.value}
                    value={icon.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      setOpen(false);
                    }}
                  >
                    <icon.icon className="mr-2 h-4 w-4" />
                    {icon.name}
                    {value === icon.value && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}