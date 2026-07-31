"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";
import {
    ArrowLeftRight,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
    createPersonEntry,
    type CreatePersonEntryState,
} from "../actions/people-actions";

type Props = {
    personId: string;
    personName: string;
};

const initialState: CreatePersonEntryState = {};

function getLocalToday() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function AddPersonEntryDialog({
    personId,
    personName,
}: Props) {
    const [open, setOpen] = useState(false);

    const [state, formAction, isPending] =
        useActionState(
            createPersonEntry,
            initialState
        );

    useEffect(() => {
        if (!state.success) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setOpen(false);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [state.success]);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!isPending) {
                    setOpen(nextOpen);
                }
            }}
        >
            <DialogTrigger
                render={
                    <Button>
                        <ArrowLeftRight className="size-4" />
                        Record activity
                    </Button>
                }
            />

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Record balance activity
                    </DialogTitle>

                    <DialogDescription>
                        Record money exchanged between you and{" "}
                        {personName}.
                    </DialogDescription>
                </DialogHeader>

                <form
                    action={formAction}
                    className="space-y-5"
                >
                    <input
                        type="hidden"
                        name="personId"
                        value={personId}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="entryType">
                            Activity
                        </Label>

                        <Select
                            name="entryType"
                            defaultValue="paid_for_person"
                            disabled={isPending}
                        >
                            <SelectTrigger
                                id="entryType"
                                className="w-full"
                            >
                                <SelectValue placeholder="Select activity" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="paid_for_person">
                                    I paid for {personName}
                                </SelectItem>

                                <SelectItem value="person_paid_for_me">
                                    {personName} paid for me
                                </SelectItem>

                                <SelectItem value="repayment_received">
                                    {personName} repaid me
                                </SelectItem>

                                <SelectItem value="repayment_sent">
                                    I repaid {personName}
                                </SelectItem>

                                <SelectItem value="adjustment">
                                    Balance adjustment
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {state.fieldErrors
                            ?.entryType?.[0] && (
                                <p className="text-sm text-destructive">
                                    {
                                        state.fieldErrors
                                            .entryType[0]
                                    }
                                </p>
                            )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                Amount
                            </Label>

                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                disabled={isPending}
                            />

                            {state.fieldErrors
                                ?.amount?.[0] && (
                                    <p className="text-sm text-destructive">
                                        {
                                            state.fieldErrors
                                                .amount[0]
                                        }
                                    </p>
                                )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">
                                Currency
                            </Label>

                            <Select
                                name="currency"
                                defaultValue="AED"
                                disabled={isPending}
                            >
                                <SelectTrigger
                                    id="currency"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Currency" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="AED">
                                        AED
                                    </SelectItem>

                                    <SelectItem value="USD">
                                        USD
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="entryDate">
                            Date
                        </Label>

                        <Input
                            id="entryDate"
                            name="entryDate"
                            type="date"
                            defaultValue={getLocalToday()}
                            disabled={isPending}
                        />

                        {state.fieldErrors
                            ?.entryDate?.[0] && (
                                <p className="text-sm text-destructive">
                                    {
                                        state.fieldErrors
                                            .entryDate[0]
                                    }
                                </p>
                            )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description
                            <span className="ml-1 text-muted-foreground">
                                (optional)
                            </span>
                        </Label>

                        <Textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="e.g. Restaurant bill"
                            disabled={isPending}
                            className="resize-none"
                        />

                        {state.fieldErrors
                            ?.description?.[0] && (
                                <p className="text-sm text-destructive">
                                    {
                                        state.fieldErrors
                                            .description[0]
                                    }
                                </p>
                            )}
                    </div>

                    {state.message && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {state.message}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                                setOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Recording...
                                </>
                            ) : (
                                "Record activity"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}