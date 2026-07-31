"use client";

import { useState, useTransition } from "react";
import { Globe2, Loader2, MapPin, Star, Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Store } from "@/features/stores/types/store";
import { archiveStore } from "@/features/stores/actions/store-actions";

function DeleteStoreButton({ store }: { store: Store }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition();
  function handleDelete() { startTransition(async () => { await archiveStore(store.id); setOpen(false); }); }
  return <AlertDialog open={open} onOpenChange={setOpen}><AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={`Archive ${store.name}`} />}><Archive className="size-4" /></AlertDialogTrigger><AlertDialogContent size="sm"><AlertDialogHeader><AlertDialogTitle>Archive this store?</AlertDialogTitle><AlertDialogDescription>“{store.name}” will no longer appear in new purchase dropdowns. Existing purchases will stay unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction type="button" onClick={handleDelete} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{pending ? <><Loader2 className="size-4 animate-spin" />Archiving...</> : <><Archive className="size-4" />Archive store</>}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

export function StoreList({ stores }: { stores: Store[] }) {
  if (!stores.length) return <Card className="border-amber-500/20 bg-amber-500/5"><CardContent className="py-14 text-center text-sm text-muted-foreground">No stores yet. Add your first store and stop typing it on every receipt.</CardContent></Card>;
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{stores.map((store) => <Card key={store.id} className="border-amber-500/15 bg-gradient-to-br from-amber-500/8 via-card to-transparent"><CardContent className="flex items-center gap-3 p-4"><div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">{store.default_channel === "online" ? <Globe2 className="size-5" /> : <MapPin className="size-5" />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate font-semibold">{store.name}</p>{store.is_favorite ? <Star className="size-3.5 fill-current text-amber-500" /> : null}</div><p className="text-xs capitalize text-muted-foreground">{store.default_channel === "online" ? "Online" : "Physical store"}</p></div><DeleteStoreButton store={store} /></CardContent></Card>)}</div>;
}
