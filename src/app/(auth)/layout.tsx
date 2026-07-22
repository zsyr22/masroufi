import type { ReactNode } from "react";
import { WalletCards } from "lucide-react";

type AuthLayoutProps = {
    children: ReactNode;
};

export default function AuthLayout({
    children,
}: AuthLayoutProps) {
    return (
        <main className="grid min-h-screen bg-background lg:grid-cols-2">
            <section className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    {children}
                </div>
            </section>

            <section className="hidden border-l border-border bg-card lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <WalletCards className="size-5" />
                    </div>

                    <span className="text-xl font-semibold tracking-tight">
                        Masroufi
                    </span>
                </div>

                <div className="max-w-lg space-y-4">
                    <h2 className="text-4xl font-semibold tracking-tight">
                        Know exactly where your money goes.
                    </h2>

                    <p className="text-base leading-7 text-muted-foreground">
                        Track accounts, expenses, savings, subscriptions,
                        and balances with people from one simple place.
                    </p>
                </div>

                <p className="text-sm text-muted-foreground">
                    Personal finance, without unnecessary complexity.
                </p>
            </section>
        </main>
    );
}