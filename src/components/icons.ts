import {
  Briefcase,
  Car,
  Clapperboard,
  CupSoda,
  Ghost,
  MapPin,
  Mountain,
  PawPrint,
  Pizza,
  Smartphone,
  Trophy,
  User,
  VenetianMask,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/game";

export const ROLE_ICON: Record<Role, LucideIcon> = {
  civilian: User,
  undercover: VenetianMask,
  mrwhite: Ghost,
};

export const TOPIC_ICONS: Record<string, LucideIcon> = {
  food: Pizza,
  drinks: CupSoda,
  animals: PawPrint,
  places: MapPin,
  jobs: Briefcase,
  sports: Trophy,
  objects: Smartphone,
  transport: Car,
  entertainment: Clapperboard,
  nature: Mountain,
};
