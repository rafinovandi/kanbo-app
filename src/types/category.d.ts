import type { Enums, Tables } from "./database.types";

export type Category = Tables<"categories">;
export type CategoryKey = Enums<"category_key">;

export type CategoryFormState = {
  status?: string;
  errors?: {
    name?: string[];
    color?: string[];
    _form?: string[];
  };
};
