import { ThemeSwitcher } from "@/components/layout/theme-switcher";

export default function DashboardPage() {
  return (
    <div>
      <div className="flex justify-end">
        <ThemeSwitcher />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>
    </div>
  );
}