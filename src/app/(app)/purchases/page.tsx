import Link from "next/link";
import { ChevronRight, Plus, ReceiptText, ShoppingBasket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserPurchases } from "@/features/purchases/services/purchase-service";
import { cn } from "@/lib/utils";

const money = (value: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value));
const date = (value: string) => new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export default async function PurchasesPage() {
  const purchases = await getCurrentUserPurchases();
  return <div className="space-y-8">
    <PageHeader title="Purchases" description="Keep the receipt total and every item inside it — just like a tidy PO." action={<Link href="/purchases/new" className={buttonVariants()}><Plus className="size-4" />New purchase</Link>} />
    {purchases.length === 0 ? (
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-orange-500/5"><CardContent className="flex flex-col items-center py-16 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600"><ShoppingBasket className="size-6" /></span><h2 className="mt-4 text-lg font-semibold">Your receipts have a home now</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Add Carrefour, Lulu, Amazon, or any receipt with all its items and one accurate account transaction.</p><Link href="/purchases/new" className={cn(buttonVariants(), "mt-5")}><Plus className="size-4" />Add first receipt</Link></CardContent></Card>
    ) : <div className="grid gap-4 lg:grid-cols-2">{purchases.map((purchase) => <Link key={purchase.id} href={`/purchases/${purchase.id}`}><Card className="h-full border-border/70 transition hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-md"><CardContent className="flex items-center gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600"><ReceiptText className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{purchase.stores?.name ?? "Store"}</h2><p className="text-xs text-muted-foreground">{date(purchase.purchase_date)} · {purchase.purchase_items?.[0]?.count ?? 0} items · {purchase.accounts?.name}</p></div><strong>{money(purchase.total, purchase.currency)}</strong></div>{purchase.notes ? <p className="mt-2 truncate text-xs text-muted-foreground">{purchase.notes}</p> : null}</div><ChevronRight className="size-4 text-muted-foreground" /></CardContent></Card></Link>)}</div>}
  </div>;
}
