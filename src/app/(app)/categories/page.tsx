import { ArrowDownLeft, ArrowUpRight, Layers3 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AddCategoryDialog } from "@/features/categories/components/add-category-dialog";
import { CategoryList } from "@/features/categories/components/category-list";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";

export default async function CategoriesPage() {
  const categories = await getCurrentUserCategories();
  const expenseCategories = categories.filter(
    (category) => category.transaction_type === "expense"
  );
  const incomeCategories = categories.filter(
    (category) => category.transaction_type === "income"
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title="Categories"
        description="Organize income and expenses using clear, reusable categories."
        action={<AddCategoryDialog />}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="All categories"
          value={String(categories.length)}
          description="Active reusable categories"
          icon={Layers3}
        />
        <StatCard
          title="Expense categories"
          value={String(expenseCategories.length)}
          description="Used to understand spending"
          icon={ArrowUpRight}
          tone="danger"
        />
        <StatCard
          title="Income categories"
          value={String(incomeCategories.length)}
          description="Used to organize money in"
          icon={ArrowDownLeft}
          tone="success"
        />
      </section>

      <div className="grid gap-7 xl:grid-cols-2">
        <CategoryList
          title="Expense categories"
          description={`${expenseCategories.length} active categories`}
          type="expense"
          categories={expenseCategories}
        />
        <CategoryList
          title="Income categories"
          description={`${incomeCategories.length} active categories`}
          type="income"
          categories={incomeCategories}
        />
      </div>
    </div>
  );
}
