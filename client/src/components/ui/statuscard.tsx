import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  subtitle?: string;
  color?: "blue" | "green" | "purple";
}

export function StatusCard({ icon, title, text, subtitle, color = "gray" }: StatusCardProps) {
  const base = {
    blue: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-800 dark:text-blue-200",
    green: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-800 dark:text-green-200",
    purple: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 text-purple-800 dark:text-purple-200",
    gray: "from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 text-gray-800 dark:text-gray-200",
  }[color];

  return (
    <Card className={`bg-gradient-to-br ${base} border-0`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-medium">{text}</p>
        {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
