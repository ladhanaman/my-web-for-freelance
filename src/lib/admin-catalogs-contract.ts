export const MAX_UPLOAD_FILES = 5;
export const MAX_UPLOAD_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_BATCH_BYTES = 200 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png"] as const;

export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export interface AdminCatalogPhoto {
  id: string;
  catalogSlug: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  assetUrl: string;
  isCover: boolean;
}

export interface AdminCatalog {
  slug: string;
  title: string;
  description: string;
  coverPhotoId: string | null;
  coverPhotoUrl: string | null;
  photoCount: number;
  photos: AdminCatalogPhoto[];
}

export interface AdminCatalogsResponse {
  catalogs: AdminCatalog[];
}

export interface AdminCatalogResponse {
  catalog: AdminCatalog;
}

export interface UpdateCatalogInput {
  title: string;
  description: string;
}

export interface SetCoverInput {
  photoId: string;
}

export interface UploadBatchResultItem {
  fileName: string;
  success: boolean;
  photoId?: string;
  error?: string;
}

export interface UploadBatchResponse {
  success: boolean;
  uploadedCount: number;
  results?: UploadBatchResultItem[];
}

export interface BackendSessionResponse {
  success: boolean;
}
