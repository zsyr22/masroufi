import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DeletePurchaseButton } from "@/features/purchases/components/delete-purchase-button";
import { getCurrentUserPurchaseById } from "@/features/purchases/services/purchase-service";

const money = (value: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value));
export default async function PurchasePage({ params }: { params: Promise<{ purchaseId: string }> }) {
  const { purchaseId } = await params; const purchase = await getCurrentUserPurchaseById(purchaseId); if (!purchase) notFound();
  return <div className="mx-auto max-w-4xl space-y-8"><PageHeader title={purchase.stores?.name ?? "Purchase"} description={`${purchase.purchase_date} · ${purchase.accounts?.name ?? "Account"} · ${purchase.categories?.name ?? "Expense"}`} action={<Link href="/purchases" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="size-4" />Purchases</Link>} />
    <Card className="border-amber-500/20"><CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="size-4 text-amber-500" />Receipt items</CardTitle></CardHeader><CardContent className="space-y-3">{purchase.purchase_items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 p-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{Number(item.quantity)} {item.unit} × {money(item.unit_price, purchase.currency)}</p></div><strong>{money(item.line_total, purchase.currency)}</strong></div>)}</CardContent></Card>
    <Card><CardContent className="space-y-3"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{money(purchase.subtotal, purchase.currency)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span>{money(purchase.tax, purchase.currency)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{money(purchase.delivery_fee, purchase.currency)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span>-{money(purchase.discount, purchase.currency)}</span></div><div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{money(purchase.total, purchase.currency)}</span></div></CardContent></Card>
    <div className="flex justify-end"><DeletePurchaseButton purchaseId={purchase.id} /></div>
  </div>;
}
