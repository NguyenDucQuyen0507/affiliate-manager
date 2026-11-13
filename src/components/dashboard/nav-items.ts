import {
  CalendarDays,
  LayoutDashboard,
  Link2,
  Smartphone,
  Tag,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/deals", label: "Deal", icon: Tag },
  { href: "/dashboard/schedule", label: "Lịch đăng", icon: CalendarDays },
  { href: "/dashboard/channels", label: "Kênh kết nối", icon: Link2 },
  { href: "/bio", label: "Trang Bio link", icon: Smartphone },
];
