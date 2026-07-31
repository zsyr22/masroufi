"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";

import { Loader2, Plus } from "lucide-react";

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
    createPerson,
    type CreatePersonState,
} from "../actions/people-actions";

const initialState: CreatePersonState = {};

export function AddPersonDialog() {
    const [open, setOpen] = useState(false);

    const [state, formAction, isPending] =
        useActionState(
            createPerson,
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
                        <Plus className="size-4" />

                        Add person
                    </Button>
                }
            />

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Add person
                    </DialogTitle>

                    <DialogDescription>
                        Add someone you exchange money
                        with or pay expenses for.
                    </DialogDescription>
                </DialogHeader>

                <form
                    action={formAction}
                    className="space-y-5"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Name
                        </Label>

                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Ahmed"
                            disabled={isPending}
                            autoFocus
                        />

                        {state.fieldErrors?.name?.[0] && (
                            <p className="text-sm text-destructive">
                                {
                                    state
                                        .fieldErrors
                                        .name[0]
                                }
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Phone
                            <span className="ml-1 text-muted-foreground">
                                (optional)
                            </span>
                        </Label>

                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+971..."
                            disabled={isPending}
                        />

                        {state.fieldErrors?.phone?.[0] && (
                            <p className="text-sm text-destructive">
                                {
                                    state
                                        .fieldErrors
                                        .phone[0]
                                }
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            Notes
                            <span className="ml-1 text-muted-foreground">
                                (optional)
                            </span>
                        </Label>

                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            placeholder="Add a short note..."
                            disabled={isPending}
                            className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        {state.fieldErrors?.notes?.[0] && (
                            <p className="text-sm text-destructive">
                                {
                                    state
                                        .fieldErrors
                                        .notes[0]
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

                                    Adding...
                                </>
                            ) : (
                                "Add person"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}