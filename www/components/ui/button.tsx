import { cn } from "~/lib/utils";

const BUTTON_COLORS = {
  outline: "text-white border border-slate-600 hover:bg-white/5",
  gray: "text-black bg-gray-200 border border-gray-300 hover:bg-gray-300",
  green: "text-white bg-green-500 border border-green-600 hover:bg-green-600",
  blue: "text-white bg-blue-500 border border-blue-600 hover:bg-blue-600",
  red: "text-white bg-red-500 border border-red-600 hover:bg-red-600",
  orange:
    "text-white bg-orange-400 border border-orange-500 hover:bg-orange-500",
  yellow:
    "text-white bg-yellow-500 border border-yellow-600 hover:bg-yellow-600",
};

const BUTTON_SIZES = {
  sm: "text-sm h-7",
  md: "text-base h-8",
  lg: "text-lg h-10",
};

export type ButtonProps = {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children: React.ReactNode;
  colorScheme?: keyof typeof BUTTON_COLORS;
  "aria-label"?: string;
  title?: string;
  size?: keyof typeof BUTTON_SIZES;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  colorScheme = "gray",
  size = "md",
  ...rest
}) => {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded px-3 py-1 font-semibold",
        BUTTON_COLORS[colorScheme],
        BUTTON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
