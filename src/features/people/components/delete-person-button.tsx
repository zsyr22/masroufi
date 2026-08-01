"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  deletePerson,
  type PersonMutationState,
} from "@/features/people/actions/people-actions";

const initialState: PersonMutationState = {};

type Props = {
  personId: string;
  personName: string;
  redirectAfterDelete?: boolean;
};

export function DeletePersonButton({
  personId,
  personName,
  redirectAfterDelete = false,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    deletePerson,
    initialState
  );

  useEffect(() => {
    if (!state.success) return;

    if (redirectAfterDelete) {
      router.push("/people");
    } else {
      router.refresh();
    }
  }, [redirectAfterDelete, router, state.success]);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive">
            <Trash2 className="size-4" />
            Delete
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {personName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the person and their personal balance ledger. Existing financial transactions will remain in Transactions, but they will no longer be linked to this person.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state.message ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <form action={formAction}>
          <input type="hidden" name="personId" value={personId} />
          <input
            type="hidden"
            name="redirectAfterDelete"
            value={redirectAfterDelete ? "true" : "false"}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
