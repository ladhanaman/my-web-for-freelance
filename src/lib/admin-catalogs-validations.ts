import { z } from "zod";

import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BATCH_BYTES,
  MAX_UPLOAD_FILE_BYTES,
  MAX_UPLOAD_FILES,
} from "@/lib/admin-catalogs-contract";

export const updateCatalogSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(300, "Description is too long"),
});

export const setCoverSchema = z.object({
  photoId: z.string().trim().min(1, "Photo id is required"),
});

export const uploadLimits = {
  maxFiles: MAX_UPLOAD_FILES,
  maxFileBytes: MAX_UPLOAD_FILE_BYTES,
  maxBatchBytes: MAX_UPLOAD_BATCH_BYTES,
  allowedMimeTypes: ALLOWED_UPLOAD_MIME_TYPES,
} as const;
