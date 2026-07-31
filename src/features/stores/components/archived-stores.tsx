"use client";
import { ArchiveRestore, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { restoreStore } from "@/features/stores/actions/store-actions";
import type { Store } from "@/features/stores/types/store";

export function ArchivedStores({ stores }: { stores: Store[] }) {
  const [selected, setSelected] = useState<Store | null>(null); const [message,setMessage]=useState<string|null>(null); const [pending,startTransition]=useTransition();
  if(!stores.length)return null;
  function restore(){ if(!selected)return; setMessage(null); startTransition(async()=>{ const result=await restoreStore(selected.id); if(!result.success){setMessage(result.message??"The store could not be restored.");return;} setSelected(null); }); }
  return <section className="space-y-4"><div><h2 className="text-lg font-semibold tracking-tight">Archived stores</h2><p className="mt-1 text-sm text-muted-foreground">Hidden from new purchases while old receipts keep their original store.</p></div><Card className="overflow-hidden border-border/70"><CardContent className="divide-y p-0">{stores.map(store=><div key={store.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-medium">{store.name}</p><Badge variant="outline">Archived</Badge></div><p className="mt-1 text-sm capitalize text-muted-foreground">{store.default_channel}</p></div><Button type="button" variant="outline" size="sm" onClick={()=>{setMessage(null);setSelected(store);}}><ArchiveRestore className="size-4"/>Restore</Button></div>)}</CardContent></Card><Dialog open={selected!==null} onOpenChange={open=>{if(!open&&!pending){setSelected(null);setMessage(null);}}}><DialogContent><DialogHeader><DialogTitle>Restore store?</DialogTitle><DialogDescription>{selected?.name} will appear again in new purchase forms.</DialogDescription></DialogHeader>{message?<p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>:null}<DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={()=>setSelected(null)}>Cancel</Button><Button type="button" disabled={pending} onClick={restore}>{pending?<><Loader2 className="size-4 animate-spin"/>Restoring...</>:<><ArchiveRestore className="size-4"/>Restore store</>}</Button></DialogFooter></DialogContent></Dialog></section>;
}
