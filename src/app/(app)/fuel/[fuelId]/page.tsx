import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteFuelButton } from "@/features/fuel/components/delete-fuel-button";
import { getFuelEntryById } from "@/features/fuel/services/fuel-service";
import { fuelTypeLabels } from "@/features/fuel/types/fuel";
import { StationLogo } from "@/features/fuel/components/station-logo";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Droplets,
  Fuel,
  Gauge,
  Pencil,
  Route,
} from "lucide-react";

function MetricCard({ icon: Icon, label, value }: { icon: typeof Fuel; label: string; value: string }) {
  return <Card><CardContent><Icon className="size-5 text-emerald-500" /><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></CardContent></Card>;
}

export default async function FuelDetailsPage({ params }: { params: Promise<{ fuelId: string }> }) {
  const { fuelId } = await params;
  const entry = await getFuelEntryById(fuelId);
  if (!entry) notFound();
  const formattedDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(`${entry.fuel_date}T00:00:00`));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/fuel"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to fuel
      </Link>

      <div className="flex items-center gap-4">
        <StationLogo stationName={entry.station_name} className="h-16 w-24" />
        <div className="min-w-0 flex-1">
          <PageHeader
            title={entry.station_name}
            description={`${fuelTypeLabels[entry.fuel_type]} · ${formattedDate}`}
            action={
              <div className="flex gap-2">
                <Link
                  href={`/fuel/${entry.id}/edit`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Pencil className="size-4" />
                  Edit
                </Link>

                <DeleteFuelButton id={entry.id} />
              </div>
            }
          />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Fuel}
          label="Total"
          value={`${Number(entry.total).toFixed(2)} ${entry.currency}`}
        />

        <MetricCard
          icon={Droplets}
          label="Liters"
          value={`${Number(entry.liters).toFixed(3)} L`}
        />

        <MetricCard
          icon={Gauge}
          label="Price / liter"
          value={`${Number(entry.price_per_liter).toFixed(3)} ${entry.currency}`}
        />

        <MetricCard
          icon={Route}
          label="Odometer"
          value={
            entry.odometer_km === null
              ? "Not recorded"
              : `${Number(entry.odometer_km).toLocaleString()} km`
          }
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fill-up details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Account</p>
            <p className="mt-1 font-medium">{entry.accounts?.name}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="mt-1 flex items-center gap-2 font-medium">
              <CalendarDays className="size-4" />
              {formattedDate}
            </p>
          </div>

          {entry.notes ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{entry.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
