"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPurchaseSchema } from "@/features/purchases/schemas/purchase-schema";
import { createClient } from "@/lib/supabase/server";

export type PurchaseActionState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function parsePurchaseForm(formData: FormData) {
  let items: unknown = [];

  try {
    const rawItems = JSON.parse(
      String(formData.get("items") ?? "[]")
    );

    if (!Array.isArray(rawItems)) {
      return {
        success: false as const,
        state: {
          message: "Purchase items have an invalid format.",
        },
      };
    }

    items = rawItems.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }

      const normalizedItem = {
        ...item,
      } as Record<string, unknown>;

      const rawName =
        typeof normalizedItem.name === "string"
          ? normalizedItem.name.trim()
          : "";

      normalizedItem.name = rawName.slice(0, 140);

      const rawPackageSize = normalizedItem.packageSize;
      const rawPackageUnit = normalizedItem.packageUnit;

      const numericPackageSize =
        rawPackageSize === "" ||
          rawPackageSize === null ||
          rawPackageSize === undefined
          ? null
          : Number(rawPackageSize);

      const normalizedPackageUnit =
        typeof rawPackageUnit === "string"
          ? rawPackageUnit.trim().toLowerCase()
          : null;

      const validPackageUnits = new Set([
        "g",
        "kg",
        "ml",
        "l",
        "piece",
        "pack",
      ]);

      const hasValidPackage =
        numericPackageSize !== null &&
        Number.isFinite(numericPackageSize) &&
        numericPackageSize > 0 &&
        normalizedPackageUnit !== null &&
        validPackageUnits.has(normalizedPackageUnit);

      if (hasValidPackage) {
        normalizedItem.packageSize = numericPackageSize;
        normalizedItem.packageUnit = normalizedPackageUnit;
      } else {
        normalizedItem.packageSize = null;
        normalizedItem.packageUnit = null;
      }

      return normalizedItem;
    });
  } catch {
    return {
      success: false as const,
      state: {
        message: "Purchase items could not be read.",
      },
    };
  }

  const parsed = createPurchaseSchema.safeParse({
    storeId: formData.get("storeId"),
    channel: formData.get("channel"),
    branchName: formData.get("branchName") || undefined,
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    purchaseDate: formData.get("purchaseDate"),
    tax: formData.get("tax") || 0,
    discount: formData.get("discount") || 0,
    deliveryFee: formData.get("deliveryFee") || 0,
    total: formData.get("total"),
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    console.error(
      "Purchase validation errors:",
      JSON.stringify(parsed.error.issues, null, 2)
    );

    const firstError = parsed.error.issues[0];

    return {
      success: false as const,
      state: {
        message: firstError
          ? `${firstError.path.join(" → ")}: ${firstError.message}`
          : "Please review the purchase fields.",
        fieldErrors: parsed.error.flatten()
          .fieldErrors as Record<string, string[]>,
      },
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}
function revalidatePurchasePaths(purchaseId?: string) {
  revalidatePath("/purchases");
  if (purchaseId) revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function createPurchase(_state: PurchaseActionState, formData: FormData): Promise<PurchaseActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Your session expired. Please sign in again." };

  const parsed = parsePurchaseForm(formData);
  if (!parsed.success) return parsed.state;
  const input = parsed.data;

  const { data, error } = await supabase.rpc("create_purchase", {
    p_store_id: input.storeId,
    p_channel: input.channel,
    p_branch_name: input.branchName ?? "",
    p_account_id: input.accountId,
    p_category_id: input.categoryId,
    p_purchase_date: input.purchaseDate,
    p_tax: input.tax,
    p_discount: input.discount,
    p_delivery_fee: input.deliveryFee,
    p_total: input.total,
    p_notes: input.notes ?? "",
    p_items: input.items,
  });

  if (error || !data) {
    console.error("Create purchase error:", error);
    return { message: error?.message ?? "The purchase could not be saved." };
  }

  revalidatePurchasePaths(data);
  redirect(`/purchases/${data}`);
}

export async function updatePurchase(purchaseId: string, _state: PurchaseActionState, formData: FormData): Promise<PurchaseActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Your session expired. Please sign in again." };

  const parsed = parsePurchaseForm(formData);
  if (!parsed.success) return parsed.state;
  const input = parsed.data;

  const { error } = await supabase.rpc("update_purchase", {
    p_purchase_id: purchaseId,
    p_store_id: input.storeId,
    p_channel: input.channel,
    p_branch_name: input.branchName ?? "",
    p_account_id: input.accountId,
    p_category_id: input.categoryId,
    p_purchase_date: input.purchaseDate,
    p_tax: input.tax,
    p_discount: input.discount,
    p_delivery_fee: input.deliveryFee,
    p_total: input.total,
    p_notes: input.notes ?? "",
    p_items: input.items,
  });

  if (error) {
    console.error("Update purchase error:", error);
    return { message: error.message ?? "The purchase could not be updated." };
  }

  revalidatePurchasePaths(purchaseId);
  redirect(`/purchases/${purchaseId}`);
}

export async function deletePurchase(purchaseId: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: purchase, error: loadError } = await supabase.from("purchases").select("transaction_id").eq("id", purchaseId).maybeSingle();
  if (loadError) return { success: false, message: loadError.message };
  if (!purchase) return { success: false, message: "Purchase not found." };
  const { error } = await supabase.from("transactions").delete().eq("id", purchase.transaction_id);
  if (error) return { success: false, message: "The purchase could not be deleted." };
  revalidatePurchasePaths();
  return { success: true };
}
