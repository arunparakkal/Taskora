import {
  BookOpen,
  Brain,
  Code,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  PenLine,
  Star,
  Target,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  droplets: Droplets,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  brain: Brain,
  target: Target,
  coffee: Coffee,
  moon: Moon,
  heart: Heart,
  "pen-line": PenLine,
  code: Code,
  star: Star,
  flame: Flame,
};

export function HabitIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Target;
  return <Icon className={className} />;
}
