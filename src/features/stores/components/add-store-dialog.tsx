"use client";

import { useActionState, useState } from "react";
import { Plus, Store as StoreIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createStore,
  type StoreActionState,
} from "@/features/stores/actions/store-actions";

const initialState: StoreActionState = {};

type StoreDialogBodyProps = {
  onClose: () => void;
};

function StoreDialogBody({ onClose }: StoreDialogBodyProps) {
  const [state, formAction, isPending] = useActionState(
    createStore,
    initialState,
  );

  return (
    <>
      <DialogHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
          <StoreIcon className="size-5" />
        </div>
        <DialogTitle>Add store</DialogTitle>
        <DialogDescription>
          Create it once, then select it from every purchase.
        </DialogDescription>
      </DialogHeader>

      {state.success ? (
        <div className="space-y-4">
          <p className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-600">
            Store added successfully.
          </p>
          <Button type="button" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Store name</Label>
            <Input
              id="store-name"
              name="name"
              placeholder="Carrefour, Amazon, Noon..."
              autoComplete="organization"
              required
            />
            {state.fieldErrors?.name?.[0] ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-channel">Default shopping method</Label>
            <Select name="defaultChannel" defaultValue="online">
              <SelectTrigger id="store-channel" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="physical">Physical store</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-website">
              Website <span className="text-muted-foreground">optional</span>
            </Label>
            <Input
              id="store-website"
              name="website"
              placeholder="amazon.ae"
              autoComplete="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-notes">Notes</Label>
            <Textarea
              id="store-notes"
              name="notes"
              rows={2}
              autoComplete="off"
            />
          </div>

          <input type="hidden" name="favorite" value="false" />

          {state.message ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add store"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

export function AddStoreDialog() {
  const [open, setOpen] = useState(false);
  const [dialogSession, setDialogSession] = useState(0);

  function closeDialog() {
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    // useActionState keeps its last result. Start every newly opened dialog
    // with a freshly mounted body so success/errors from the previous store
    // do not leak into the next create flow.
    if (nextOpen) {
      setDialogSession((current) => current + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button">
            <Plus className="size-4" />
            Add store
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <StoreDialogBody key={dialogSession} onClose={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
