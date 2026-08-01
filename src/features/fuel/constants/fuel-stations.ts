export type FuelStation = {
  id: string;
  name: string;
  slug: string;
  logo_path: string;
  brand_color: string;
};

export const fallbackFuelStations: FuelStation[] = [
  { id: "enoc", name: "ENOC", slug: "enoc", logo_path: "/fuel-stations/enoc.svg", brand_color: "#f6b900" },
  { id: "adnoc", name: "ADNOC", slug: "adnoc", logo_path: "/fuel-stations/adnoc.svg", brand_color: "#0b5cab" },
  { id: "emarat", name: "Emarat", slug: "emarat", logo_path: "/fuel-stations/emarat.svg", brand_color: "#008c45" },
];

export function getFuelStation(name: string) {
  const normalized = name.trim().toLowerCase();
  return fallbackFuelStations.find((station) => station.name.toLowerCase() === normalized) ?? fallbackFuelStations[0];
}
