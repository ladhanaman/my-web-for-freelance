// ── Site-wide section IDs used for NavBar scroll targeting
// Rename values here to propagate to NavBar and all section id= attributes
export const SECTION_IDS = {
  hero:        "home",
  gun:         "work",
  photography: "framescape",
  contact:     "contact",
} as const

// ── Human-readable page / section names
// Rename values here and they propagate everywhere
export const PAGE_NAMES = {
  photography: "Framescape",
  gallery:     "Gallery",
} as const

// ── Route base path for the gallery detail page
export const GALLERY_BASE_PATH = "/gallery"

// ────────────────────────────────────────────────────────────────────────────
// Collection data
//
// Photos live in /public/photos/{slug}/.
// Drop images there and update the arrays below.
//
// coverPhoto  — shown in the Framescape section (one per collection)
// photos      — all photos shown in the /gallery/[slug] drag board
//
// Set coverPhoto to "" and photos to [] until you've added the files;
// a placeholder will render automatically.
// ────────────────────────────────────────────────────────────────────────────

export interface Collection {
  /** URL-safe identifier — drives the /gallery/[slug] route */
  slug: string
  /** Display name shown in Framescape section and Gallery page header */
  name: string
  /** Short caption shown in the Gallery footer */
  description: string
  /**
   * Path under /public to the cover image (e.g. "/photos/portraits/cover.jpg").
   * Leave "" to show a placeholder until the file is added.
   */
  coverPhoto: string
  /**
   * All photo paths under /public for the Gallery drag board.
   * Empty array renders placeholders.
   */
  photos: string[]
}

export const COLLECTIONS: Collection[] = [
  {
    slug:        "portraits",
    name:        "Portraits",
    description: "Human stories in light and shadow",
    coverPhoto:  "/photos/portraits/cover.jpg",
    photos: [
      "/photos/portraits/01.jpg",
      "/photos/portraits/02.jpg",
      "/photos/portraits/03.jpg",
      "/photos/portraits/04.jpg",
      "/photos/portraits/05.jpg",
      "/photos/portraits/06.jpg",
    ],
  },
  {
    slug:        "landscapes",
    name:        "Landscapes",
    description: "Earth's quiet grandeur",
    coverPhoto:  "/photos/landscapes/cover.jpg",
    photos: [
      "/photos/landscapes/01.jpg",
      "/photos/landscapes/02.jpg",
      "/photos/landscapes/03.jpg",
      "/photos/landscapes/04.jpg",
      "/photos/landscapes/05.jpg",
    ],
  },
  {
    slug:        "street",
    name:        "Street",
    description: "Life between the frames",
    coverPhoto:  "/photos/street/cover.jpg",
    photos: [
      "/photos/street/01.jpg",
      "/photos/street/02.jpg",
      "/photos/street/03.jpg",
      "/photos/street/04.jpg",
      "/photos/street/05.jpg",
      "/photos/street/06.jpg",
      "/photos/street/07.jpg",
      "/photos/street/08.jpg",
    ],
  },
  {
    slug:        "architecture",
    name:        "Architecture",
    description: "Form follows light",
    coverPhoto:  "/photos/architecture/cover.jpg",
    photos: [
      "/photos/architecture/01.jpg",
      "/photos/architecture/02.jpg",
      "/photos/architecture/03.jpg",
      "/photos/architecture/04.jpg",
      "/photos/architecture/05.jpg",
      "/photos/architecture/06.jpg",
    ],
  },
  {
    slug:        "nature",
    name:        "Nature",
    description: "Patterns in the wild",
    coverPhoto:  "/photos/nature/cover.jpg",
    photos: [
      "/photos/nature/01.jpg",
      "/photos/nature/02.jpg",
      "/photos/nature/03.jpg",
      "/photos/nature/04.jpg",
    ],
  },
  {
    slug:        "golden-hour",
    name:        "Golden Hour",
    description: "The light that changes everything",
    coverPhoto:  "/photos/golden-hour/cover.jpg",
    photos: [
      "/photos/golden-hour/01.jpg",
      "/photos/golden-hour/02.jpg",
      "/photos/golden-hour/03.jpg",
      "/photos/golden-hour/04.jpg",
      "/photos/golden-hour/05.jpg",
      "/photos/golden-hour/06.jpg",
    ],
  },
  {
    slug:        "black-and-white",
    name:        "Black & White",
    description: "Stripped to essentials",
    coverPhoto:  "/photos/black-and-white/cover.jpg",
    photos: [
      "/photos/black-and-white/01.jpg",
      "/photos/black-and-white/02.jpg",
      "/photos/black-and-white/03.jpg",
      "/photos/black-and-white/04.jpg",
      "/photos/black-and-white/05.jpg",
    ],
  },
  {
    slug:        "candid",
    name:        "Candid",
    description: "Unguarded moments, real emotion",
    coverPhoto:  "/photos/candid/cover.jpg",
    photos: [
      "/photos/candid/01.jpg",
      "/photos/candid/02.jpg",
      "/photos/candid/03.jpg",
      "/photos/candid/04.jpg",
      "/photos/candid/05.jpg",
      "/photos/candid/06.jpg",
      "/photos/candid/07.jpg",
    ],
  },
]
