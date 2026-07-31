"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";

import {
  updateAccount,
  type AccountActionState,
} from "@/features/accounts/actions/account-actions";
import type {
  AccountType,
  AccountWithBalance,
  CurrencyCode,
} from "@/features/accounts/types/account";

type Props = {
  account: AccountWithBalance;
};

type FormProps = Props & {
  onCancel: () => void;
  onSuccess: () => void;
};

const initialState: AccountActionState = {};

function EditAccountForm({ account, onCancel, onSuccess }: FormProps) {
  const [name, setName] = useState(account.name);
  const [openingBalance, setOpeningBalance] = useState(
    String(account.opening_balance)
  );
  const [accountType, setAccountType] = useState<AccountType>(account.type);
  const [currency, setCurrency] = useState<CurrencyCode>(account.currency);
  const [included, setIncluded] = useState(
    account.is_included_in_available_balance
  );

  const [state, formAction, isPending] = useActionState(
    updateAccount,
    initialState
  );

  useEffect(() => {
    if (!state.success) return;

    const timeoutId = window.setTimeout(onSuccess, 0);
    return () => window.clearTimeout(timeoutId);
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="accountId" value={account.id} />
      <input type="hidden" name="type" value={accountType} />
      <input type="hidden" name="currency" value={currency} />
      <input
        type="hidden"
        name="isIncludedInAvailableBalance"
        value={String(included)}
      />

      <div className="space-y-2">
        <Label htmlFor={`name-${account.id}`}>Account name</Label>
        <Input
          id={`name-${account.id}`}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          required
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Account type</Label>
          <Select
            value={accountType}
            onValueChange={(value) => {
              if (value) setAccountType(value as AccountType);
            }}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank">Bank account</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={currency}
            onValueChange={(value) => {
              if (value) setCurrency(value as CurrencyCode);
            }}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.currency?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.currency[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`opening-${account.id}`}>Opening balance</Label>
        <div className="relative">
          <Input
            id={`opening-${account.id}`}
            name="openingBalance"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={openingBalance}
            onChange={(event) => setOpeningBalance(event.target.value)}
            className="pr-16"
            disabled={isPending}
            required
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {currency}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Changing this value changes the calculated current balance.
        </p>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border bg-muted/30 p-4">
        <div>
          <Label>Include in available money</Label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Disable this for money that should not be used for daily spending.
          </p>
        </div>
        <Switch
          checked={included}
          onCheckedChange={setIncluded}
          disabled={isPending}
        />
      </div>

      {state.message && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}

export function EditAccountDialog({ account }: Props) {
  const [open, setOpen] = useState(false);
  const [formRevision, setFormRevision] = useState(0);

  const closeAndReset = useCallback(() => {
    setOpen(false);
    setFormRevision((revision) => revision + 1);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setFormRevision((revision) => revision + 1);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            Edit
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>
            Update the account details and balance settings.
          </DialogDescription>
        </DialogHeader>

        <EditAccountForm
          key={`${account.id}-${formRevision}`}
          account={account}
          onCancel={closeAndReset}
          onSuccess={closeAndReset}
        />
      </DialogContent>
    </Dialog>
  );
}
