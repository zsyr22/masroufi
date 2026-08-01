import { FuelDashboard } from "@/features/fuel/components/fuel-dashboard";
import { getFuelEntries } from "@/features/fuel/services/fuel-service";

export default async function FuelPage() {
  const entries = await getFuelEntries();

  return <FuelDashboard entries={entries} />;
}
