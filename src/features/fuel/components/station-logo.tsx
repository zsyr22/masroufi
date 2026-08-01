import Image from "next/image";
import { cn } from "@/lib/utils";
import { getFuelStation } from "@/features/fuel/constants/fuel-stations";

type Props = {
  stationName: string;
  className?: string;
  imageClassName?: string;
  compact?: boolean;
};

export function StationLogo({
  stationName,
  className,
  imageClassName,
  compact = false,
}: Props) {
  const station = getFuelStation(stationName);

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-white",
        compact
          ? "h-7 w-11 rounded-md p-0.5 shadow-none"
          : "h-14 w-20 rounded-2xl border p-2.5 shadow-sm",
        className
      )}
      style={
        compact
          ? undefined
          : {
            borderColor: `${station.brand_color}55`,
            boxShadow: `0 12px 30px ${station.brand_color}16`,
          }
      }
    >
      <Image
        src={station.logo_path}
        alt={`${station.name} logo`}
        width={92}
        height={52}
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}