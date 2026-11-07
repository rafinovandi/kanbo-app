"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { DUPLICATE_CATEGORY_MESSAGE, validateCategory } from "@/validations/category";

export type CategoryActionResult = { status: "success" } | { status: "error"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_ALLOWED = "You don't have permission to do that.";
const FAILED = "Something went wrong. Try again.";

const fail = (message: string): CategoryActionResult => ({ status: "error", message });

// The caller's Supabase client, or null when the session is gone. Only admins can add, edit or
// delete categories: RLS and delete_category() enforce it, these actions only report the result.
async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? supabase : null;
}

// Unique-name clashes and the rules of delete_category() (Done, last column) carry readable messages.
const messageFor = (error: { code?: string; message: string }) => {
  if (error.code === "23505") return DUPLICATE_CATEGORY_MESSAGE;
  return error.code === "P0001" || error.code === "P0002" ? error.message : FAILED;
};

function done(): CategoryActionResult {
  revalidatePath("/", "layout");
  return { status: "success" };
}

// Adds a column at the end of the project's board.
export async function createCategoryAction(projectId: string, name: string, color: string): Promise<CategoryActionResult> {
  const { values, errors } = validateCategory({ name, color, takenNames: [] });
  if (!UUID.test(projectId) || errors.name || errors.color) return fail(errors.name?.[0] ?? errors.color?.[0] ?? FAILED);

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { data: last } = await supabase
    .from("categories")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("categories")
    .insert({ project_id: projectId, name: values.name, color: values.color, position: (last?.position ?? 0) + 1 });
  return error ? fail(error.code === "42501" ? NOT_ALLOWED : messageFor(error)) : done();
}

export async function updateCategoryAction(categoryId: string, name: string, color: string): Promise<CategoryActionResult> {
  const { values, errors } = validateCategory({ name, color, takenNames: [] });
  if (!UUID.test(categoryId) || errors.name || errors.color) return fail(errors.name?.[0] ?? errors.color?.[0] ?? FAILED);

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { data, error } = await supabase
    .from("categories")
    .update({ name: values.name, color: values.color })
    .eq("id", categoryId)
    .select("id");
  if (error) return fail(messageFor(error));
  return data.length > 0 ? done() : fail(NOT_ALLOWED);
}

// Deletes a column; its tasks move to the next column (or the previous one when it is the last).
export async function deleteCategoryAction(categoryId: string): Promise<CategoryActionResult> {
  if (!UUID.test(categoryId)) return fail(FAILED);

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { error } = await supabase.rpc("delete_category", { p_category_id: categoryId });
  return error ? fail(error.code === "42501" ? NOT_ALLOWED : messageFor(error)) : done();
}

// Saves the column order: the full list of the project's category ids, left to right. Admin only.
export async function reorderCategoriesAction(projectId: string, categoryIds: string[]): Promise<CategoryActionResult> {
  if (!UUID.test(projectId) || categoryIds.length === 0 || categoryIds.length > 50 || !categoryIds.every((id) => UUID.test(id))) {
    return fail(FAILED);
  }

  const supabase = await getSession();
  if (!supabase) return fail("Your session expired. Sign in again.");

  const { error } = await supabase.rpc("reorder_categories", { p_project_id: projectId, p_category_ids: categoryIds });
  if (error) return fail(error.code === "42501" ? NOT_ALLOWED : FAILED);
  return done();
}
