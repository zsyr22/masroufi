import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  Landmark,
  LayoutDashboard,
  Repeat2,
  ReceiptText,
  Store,
  Settings,
  ShoppingBasket,
  Tags,
  Users,
  WalletCards,
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tone: "bg-violet-500/12 text-violet-600 dark:text-violet-300" },
  { label: "Accounts", href: "/accounts", icon: WalletCards, tone: "bg-blue-500/12 text-blue-600 dark:text-blue-300" },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight, tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" },
  { label: "Purchases", href: "/purchases", icon: ShoppingBasket, tone: "bg-amber-500/14 text-amber-700 dark:text-amber-300" },
  { label: "Stores", href: "/stores", icon: Store, tone: "bg-yellow-500/12 text-yellow-700 dark:text-yellow-300" },
  { label: "Bills", href: "/bills", icon: ReceiptText, tone: "bg-sky-500/12 text-sky-600 dark:text-sky-300" },
  { label: "Transfers", href: "/transfers", icon: Landmark, tone: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-300" },
  { label: "Categories", href: "/categories", icon: Tags, tone: "bg-orange-500/12 text-orange-600 dark:text-orange-300" },
  { label: "People", href: "/people", icon: Users, tone: "bg-pink-500/12 text-pink-600 dark:text-pink-300" },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat2, tone: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-300" },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined, tone: "bg-teal-500/12 text-teal-600 dark:text-teal-300" },
  { label: "Settings", href: "/settings", icon: Settings, tone: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
] as const;
