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
  Forklift,
} from "lucide-react";

const iconMap = {
  Check,
  CheckSquare,
  ClipboardList,
  Clipboard,
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
  Forklift,
};

export function getIcon(iconName?: string | null) {
  if (!iconName || !iconMap[iconName as keyof typeof iconMap]) {
    return null;
  }
  return iconMap[iconName as keyof typeof iconMap];
}

export function renderIcon(iconName?: string | null, className?: string) {
  const IconComponent = getIcon(iconName);
  if (!IconComponent) {
    return null;
  }
  return <IconComponent className={className} />;
}
