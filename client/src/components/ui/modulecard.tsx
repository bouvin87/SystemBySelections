interface ModuleCardProps {
  title: string;
  description: string;
  color?: "blue" | "red" | "gray";
}

export function ModuleCard({ title, description, color = "gray" }: ModuleCardProps) {
  const styles = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
    gray: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100",
  }[color];

  return (
    <div className={`p-4 border rounded-lg ${styles}`}>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  );
}
