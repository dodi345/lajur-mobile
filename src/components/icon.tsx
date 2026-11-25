import Svg, { Path } from "react-native-svg";
import { BOXICONS, type BoxIconName } from "@/lib/boxicons";
import { useTheme } from "@/lib/theme";

// Ikon Boxicons yang sama persis dengan web (@boxicons/react, pack "basic" / "filled"), digambar dengan SVG.
// Ukuran web: xs 16, sm 20, base 24.

export type { BoxIconName };

export function Icon({
  name,
  size = 20,
  color,
  filled = false,
}: {
  name: BoxIconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  const theme = useTheme();
  const icon: { basic: readonly string[]; filled?: readonly string[] } = BOXICONS[name];
  const paths = (filled && icon.filled) || icon.basic;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths.map((d) => (
        <Path key={d} d={d} fill={color ?? theme.foreground} />
      ))}
    </Svg>
  );
}
