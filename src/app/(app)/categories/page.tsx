import { PageHeader } from "@/components/shared/page-header";
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
        <div className="space-y-8">
            <PageHeader
                title="Categories"
                description="Organize your income and expenses using clear, reusable categories."
                action={<AddCategoryDialog />}
            />

            <div className="grid gap-8 xl:grid-cols-2">
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