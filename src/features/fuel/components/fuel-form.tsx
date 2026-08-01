"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AccountWithBalance } from "@/features/accounts/types/account";
import type { FuelStation } from "@/features/fuel/constants/fuel-stations";
import { StationLogo } from "@/features/fuel/components/station-logo";
import { createFuelEntry, updateFuelEntry, type FuelActionState } from "@/features/fuel/actions/fuel-actions";
import { fuelTypeLabels, fuelTypes, type FuelEntry, type FuelType } from "@/features/fuel/types/fuel";
import type { UaeFuelPrices } from "@/features/fuel/services/uae-fuel-price-service";
import { cn } from "@/lib/utils";

const initialState: FuelActionState = {};
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const n = (value: string) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0; };

type CalculatorField = "price" | "liters" | "total";

function formatPrice(value: number) {
  return value.toFixed(3);
}
type Props = {
  accounts: AccountWithBalance[];
  stations: FuelStation[];
  initialValues?: FuelEntry;
  currentFuelPrices: UaeFuelPrices | null;
  fuelPriceSource?: string;
  fuelPricesFetchedAt?: string;
};

export function FuelForm({
  accounts,
  stations,
  initialValues,
  currentFuelPrices,
  fuelPriceSource,
  fuelPricesFetchedAt,
}: Props) {
  const isEdit = Boolean(initialValues);
  const action = isEdit ? updateFuelEntry : createFuelEntry;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [accountId, setAccountId] = useState(initialValues?.account_id ?? accounts[0]?.id ?? "");
  const [fuelType, setFuelType] = useState(initialValues?.fuel_type ?? "special_95");
  const [stationName, setStationName] = useState(initialValues?.station_name ?? stations[0]?.name ?? "ENOC");
  const selectedStation = stations.find((station) => station.name === stationName) ?? stations[0];
  const [liters, setLiters] = useState(initialValues ? String(initialValues.liters) : "");
  const [total, setTotal] = useState(initialValues ? String(initialValues.total) : "");
  const account = accounts.find((item) => item.id === accountId);
  const defaultFuelType: FuelType = initialValues?.fuel_type ?? "special_95";
  const defaultLivePrice = currentFuelPrices?.[defaultFuelType];

  const [price, setPrice] = useState(
    initialValues
      ? String(initialValues.price_per_liter)
      : defaultLivePrice
        ? formatPrice(defaultLivePrice)
        : ""
  );

  const [calculationFields, setCalculationFields] = useState<
    CalculatorField[]
  >(initialValues ? ["price", "liters"] : ["price"]);

  const computedHint = useMemo(() => {
    if (n(price) && n(liters)) return `${n(price).toFixed(3)} × ${n(liters).toFixed(3)} = ${(n(price) * n(liters)).toFixed(2)} ${account?.currency ?? ""}`;
    return "Enter any two values and the third one is calculated automatically.";
  }, [price, liters, account?.currency]);

  function update(field: CalculatorField, value: string) {
    const values = {
      price,
      liters,
      total,
      [field]: value,
    };

    if (field === "price") setPrice(value);
    if (field === "liters") setLiters(value);
    if (field === "total") setTotal(value);

    const nextCalculationFields = [
      ...calculationFields.filter((item) => item !== field),
      field,
    ].slice(-2) as CalculatorField[];

    setCalculationFields(nextCalculationFields);

    if (nextCalculationFields.length < 2) {
      return;
    }

    const hasPrice = nextCalculationFields.includes("price");
    const hasLiters = nextCalculationFields.includes("liters");
    const hasTotal = nextCalculationFields.includes("total");

    const priceValue = n(values.price);
    const litersValue = n(values.liters);
    const totalValue = n(values.total);

    if (hasPrice && hasLiters && priceValue && litersValue) {
      setTotal((priceValue * litersValue).toFixed(2));
      return;
    }

    if (hasPrice && hasTotal && priceValue && totalValue) {
      setLiters((totalValue / priceValue).toFixed(3));
      return;
    }

    if (hasLiters && hasTotal && litersValue && totalValue) {
      setPrice((totalValue / litersValue).toFixed(3));
    }
  }

  function handleFuelTypeChange(value: string | null) {
    const nextFuelType = (value ?? "special_95") as typeof fuelType;
    const suggestedPrice = currentFuelPrices?.[nextFuelType];

    setFuelType(nextFuelType);

    if (!suggestedPrice) {
      return;
    }

    const nextPrice = formatPrice(suggestedPrice);

    setPrice(nextPrice);

    const litersValue = n(liters);
    const totalValue = n(total);

    if (litersValue) {
      setTotal((suggestedPrice * litersValue).toFixed(2));
      setCalculationFields(["price", "liters"]);
      return;
    }

    if (totalValue) {
      setLiters((totalValue / suggestedPrice).toFixed(3));
      setCalculationFields(["price", "total"]);
      return;
    }

    setCalculationFields(["price"]);
  }

  const error = (key: string) => state.fieldErrors?.[key]?.[0];

  return <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/7 via-card to-transparent">
    <CardContent className="p-5 sm:p-6">
      <form action={formAction} className="space-y-5" aria-busy={pending}>
        {initialValues ? <input type="hidden" className="h-11" name="fuelId" value={initialValues.id} /> : null}
        <input type="hidden" className="h-11" name="accountId" value={accountId} /><input type="hidden" name="fuelType" value={fuelType} /><input type="hidden" name="stationName" value={stationName} />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Station</Label>
            <Select value={stationName} onValueChange={(value) => setStationName(value ?? stations[0]?.name ?? "ENOC")}>
              <SelectTrigger className="h-11 w-full px-2">
                <span className="flex min-w-0 items-center gap-2">
                  {selectedStation ? (
                    <StationLogo
                      stationName={selectedStation.name}
                      compact
                    />
                  ) : null}

                  <span className="truncate font-medium">
                    {selectedStation?.name ?? "Select station"}
                  </span>
                </span>

                <SelectValue className="sr-only" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.name}>
                    <span className="flex items-center gap-2.5">
                      <StationLogo
                        stationName={station.name}
                        compact
                      />
                      <span>{station.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>{error("stationName") && <p className="text-xs text-destructive">{error("stationName")}</p>}</div>
          <div className="space-y-2">
            <Label>Fuel date</Label>
            <Input type="date" className="h-11" name="fuelDate" defaultValue={initialValues?.fuel_date ?? today()} aria-invalid={Boolean(error("fuelDate"))} /></div>
          <div className="space-y-2">
            <Label>Account</Label>

            <Select
              value={accountId}
              onValueChange={(value) => setAccountId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <span>
                  {account
                    ? `${account.name} · ${account.currency}`
                    : "Select account"}
                </span>

                <SelectValue className="sr-only" />
              </SelectTrigger>

              <SelectContent>
                {accounts.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>        <div className="space-y-2"><Label>Fuel type</Label><Select
            value={fuelType}
            onValueChange={handleFuelTypeChange}
          ><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{fuelTypes.map((type) => <SelectItem key={type} value={type}>{fuelTypeLabels[type]}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/50 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-emerald-500" />
              <p className="text-sm font-medium">Smart fuel calculator</p>
            </div>

            {!initialValues && currentFuelPrices && fuelPriceSource ? (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-500">
                Latest UAE price · {fuelPriceSource}
              </span>
            ) : null}
          </div>

          {!initialValues && !currentFuelPrices ? (
            <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
              Live UAE prices are temporarily unavailable. Enter the pump price manually before saving.
            </p>
          ) : null}

          {!initialValues && currentFuelPrices && fuelPricesFetchedAt ? (
            <p className="mb-4 text-xs text-muted-foreground">
              Checked automatically when this page opened at{" "}
              {new Intl.DateTimeFormat("en-AE", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(fuelPricesFetchedAt))}
              .
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Price / liter</Label>
            <Input name="pricePerLiter" className="h-11" inputMode="decimal" value={price} onChange={(e) => update("price", e.target.value)} placeholder="2.570" /></div>
          <div className="space-y-2">
            <Label>Liters</Label>
            <Input name="liters" className="h-11" inputMode="decimal" value={liters} onChange={(e) => update("liters", e.target.value)} placeholder="45.000" /></div>
          <div className="space-y-2">
            <Label>Total</Label>
            <Input name="total" className="h-11" inputMode="decimal" value={total} onChange={(e) => update("total", e.target.value)} placeholder="115.65" /></div>
        </div>
          <p className="mt-3 text-xs text-muted-foreground">{computedHint}</p>
          {error("total") && <p className="mt-2 text-xs text-destructive">{error("total")}</p>}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Odometer (km)
              <span className="text-xs font-normal text-muted-foreground">
                optional
              </span>
            </Label>
            <Input name="odometerKm" className="h-11" inputMode="decimal" defaultValue={initialValues?.odometer_km ?? ""} placeholder="14,250" /></div><div className="space-y-2"><Label>Notes
              <span className="text-muted-foreground">optional</span>
            </Label>
            <Textarea name="notes" defaultValue={initialValues?.notes ?? ""} placeholder="Full tank, highway trip..." />
          </div>
        </div>
        {state.message && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.message}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
          <Link href={initialValues ? `/fuel/${initialValues.id}` : "/fuel"} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>Cancel</Link>
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Save fuel entry"}
          </Button>
        </div>
      </form>
    </CardContent></Card>;
}
