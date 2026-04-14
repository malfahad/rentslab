import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type {
  ExpenseCategoryCreate,
  ExpenseCategoryDto,
  ExpenseCreate,
  ExpenseDto,
  ExpenseUpdate,
} from "@/types/expense";

export type ListExpensesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  status?: string;
};

export async function listExpenses(
  options?: ListExpensesParams,
): Promise<PaginatedResponse<ExpenseDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<ExpenseDto>>(
    `/expenses/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      status: options?.status,
    })}`,
  );
}

export async function getExpense(id: number): Promise<ExpenseDto> {
  return apiRequestAuthed<ExpenseDto>(`/expenses/${id}/`);
}

export async function createExpense(body: ExpenseCreate): Promise<ExpenseDto> {
  return apiRequestAuthed<ExpenseDto>("/expenses/", {
    method: "POST",
    body,
  });
}

export async function updateExpense(
  id: number,
  body: ExpenseUpdate,
): Promise<ExpenseDto> {
  return apiRequestAuthed<ExpenseDto>(`/expenses/${id}/`, {
    method: "PATCH",
    body,
  });
}

/** Categories are unpaginated list responses from the API. */
export async function listAllExpenseCategories(): Promise<
  ExpenseCategoryDto[]
> {
  return apiRequestAuthed<ExpenseCategoryDto[]>("/expense-categories/");
}

export async function createExpenseCategory(
  body: ExpenseCategoryCreate,
): Promise<ExpenseCategoryDto> {
  return apiRequestAuthed<ExpenseCategoryDto>("/expense-categories/", {
    method: "POST",
    body,
  });
}
