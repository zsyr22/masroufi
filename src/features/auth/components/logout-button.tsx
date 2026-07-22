"use client";

import { LogOut } from "lucide-react";

import { logout } from "@/features/auth/actions/auth-actions";
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

export function LogoutButton() {
    return (
        <AlertDialog>
            <AlertDialogTrigger
                render={
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    />
                }
            >
                <LogOut className="size-4" />
                <span>Sign out</span>
            </AlertDialogTrigger>

            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Sign out of Masroufi?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        Are you sure you want to sign out? You will need to enter your
                        email and password again to access your account.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>
                        Cancel
                    </AlertDialogCancel>

                    <form action={logout}>
                        <AlertDialogAction
                            type="submit"
                            className="w-full sm:w-auto"
                        >
                            Sign out
                        </AlertDialogAction>
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}