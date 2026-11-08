import "server-only";

import { environment } from "@/configs/environment";
import { failure } from "@/lib/agent/http";

export const invalid = (message: string) => failure(422, "validation_failed", message);
export const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
export const boardUrl = (projectId: string) => `${environment.APP_URL}/projects/${projectId}`;
