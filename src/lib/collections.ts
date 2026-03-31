// ── Site-wide section IDs used for NavBar scroll targeting
// Rename values here to propagate to NavBar and all section id= attributes
export const SECTION_IDS = {
  hero: "home",
  gun: "work",
  photography: "framescape",
  onekoCat: "oneko-cat",
} as const

// ── Human-readable page / section names
// Rename values here and they propagate everywhere
export const PAGE_NAMES = {
  photography: "Framescape",
  gallery: "Gallery",
} as const

// ── Route base path for the gallery detail page
export const GALLERY_BASE_PATH = "/gallery"

// ────────────────────────────────────────────────────────────────────────────
// Collection data
//
// Original masters live in /assets/photos-originals/{slug}/.
// Generated web assets live in /public/photos/{slug}/.
// Run `npm run photos:optimize` after changing source files.
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
   * Path under /public to the generated cover image (e.g. "/photos/portraits/cover.webp").
   * Leave "" to show a placeholder until the file is added.
   */
  coverPhoto: string
  /**
   * All photo paths under /public for the Gallery drag board.
   * Empty array renders placeholders.
   */
  photos: string[]
  /** Dynamic heading for the gallery page */
  galleryHeading: string
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "black-and-white",
    name: "Black & White",
    description: "Stripped to essentials",
    galleryHeading: "stripped to bone.",
    coverPhoto: "/photos/black-and-white/cover.webp",
    photos: [
      "/photos/black-and-white/2.webp",
      "/photos/black-and-white/3.webp",
      "/photos/black-and-white/4.webp",
      "/photos/black-and-white/5.webp",
      "/photos/black-and-white/6.webp",
      "/photos/black-and-white/7.webp",
      "/photos/black-and-white/8.webp",
      "/photos/black-and-white/9.webp",
      "/photos/black-and-white/10.webp",
      "/photos/black-and-white/11.webp",
      "/photos/black-and-white/12.webp",
      "/photos/black-and-white/13.webp",
      "/photos/black-and-white/14.webp",
    ],
  },
  {
    slug: "cowries",
    name: "Cowries",
    description: "Ocean's currency",
    galleryHeading: "ocean's spare change.",
    coverPhoto: "/photos/cowries/cover.webp",
    photos: [
      "/photos/cowries/cover.webp",
      "/photos/cowries/1.webp",
      "/photos/cowries/2.webp",
      "/photos/cowries/3.webp",
      "/photos/cowries/4.webp",
      "/photos/cowries/5.webp",
      "/photos/cowries/7.webp",
      "/photos/cowries/8.webp",
      "/photos/cowries/9.webp",
      "/photos/cowries/10.webp",
      "/photos/cowries/11.webp",
    ],
  },
  {
    slug: "desert-soul",
    name: "Desert Soul",
    description: "The sweeping dunes",
    galleryHeading: "sand never settles.",
    coverPhoto: "/photos/desert-soul/cover.webp",
    photos: [
      "/photos/desert-soul/1.webp",
      "/photos/desert-soul/2.webp",
      "/photos/desert-soul/3.webp",
      "/photos/desert-soul/5.webp",
      "/photos/desert-soul/6.webp",
      "/photos/desert-soul/7.webp",
      "/photos/desert-soul/54.webp",
    ],
  },
  {
    slug: "framed-by-the-winds",
    name: "Framed By The Winds",
    description: "Wind-carved moments",
    galleryHeading: "nothing but wind.",
    coverPhoto: "/photos/framed-by-the-winds/cover.webp",
    photos: [
      "/photos/framed-by-the-winds/50.webp",
      "/photos/framed-by-the-winds/51.webp",
      "/photos/framed-by-the-winds/52.webp",
      "/photos/framed-by-the-winds/53.webp",
      "/photos/framed-by-the-winds/54.webp",
      "/photos/framed-by-the-winds/55.webp",
      "/photos/framed-by-the-winds/56.webp",
    ],
  },
  {
    slug: "ghoose",
    name: "Ghoose",
    description: "Flights of fancy",
    galleryHeading: "never looked back.",
    coverPhoto: "/photos/ghoose/cover.webp",
    photos: [
      "/photos/ghoose/1.webp",
      "/photos/ghoose/2.webp",
      "/photos/ghoose/3.webp",
      "/photos/ghoose/4.webp",
      "/photos/ghoose/5.webp",
      "/photos/ghoose/6.webp",
      "/photos/ghoose/7.webp",
    ],
  },
  {
    slug: "lost-boat",
    name: "Lost Boat",
    description: "Adrift in time",
    galleryHeading: "sinking with style.",
    coverPhoto: "/photos/lost-boat/cover.webp",
    photos: [
      "/photos/lost-boat/1.webp",
      "/photos/lost-boat/2.webp",
      "/photos/lost-boat/3.webp",
      "/photos/lost-boat/4.webp",
      "/photos/lost-boat/5.webp",
    ],
  },
  {
    slug: "shimmering",
    name: "Shimmering",
    description: "Dancing reflections",
    galleryHeading: "dancing on water.",
    coverPhoto: "/photos/shimmering/cover.webp",
    photos: [
      "/photos/shimmering/0.webp",
      "/photos/shimmering/1.webp",
      "/photos/shimmering/2.webp",
      "/photos/shimmering/3.webp",
      "/photos/shimmering/4.webp",
      "/photos/shimmering/5.webp",
      "/photos/shimmering/6.webp",
      "/photos/shimmering/7.webp",
      "/photos/shimmering/8.webp",
    ],
  },
  {
    slug: "sunny-day",
    name: "Sunny Day",
    description: "Basking in the light",
    galleryHeading: "stay a while.",
    coverPhoto: "/photos/sunny-day/cover.webp",
    photos: [
      "/photos/sunny-day/06.webp",
      "/photos/sunny-day/2.webp",
      "/photos/sunny-day/3.webp",
      "/photos/sunny-day/4.webp",
      "/photos/sunny-day/5.webp",
      "/photos/sunny-day/6.webp",
      "/photos/sunny-day/7.webp",
      "/photos/sunny-day/8.webp",
      "/photos/sunny-day/9.webp",
      "/photos/sunny-day/10.webp",
      "/photos/sunny-day/12.webp",
    ],
  },
  {
    slug: "broken-car",
    name: "Broken Car",
    description: "Rust and memories",
    galleryHeading: "memories in rust.",
    coverPhoto: "/photos/broken-car/cover.webp",
    photos: [
      "/photos/broken-car/2.webp",
      "/photos/broken-car/3.webp",
      "/photos/broken-car/4.webp",
      "/photos/broken-car/5.webp",
      "/photos/broken-car/6.webp",
    ],
  },
]

// ── Returns the previous and next collections relative to a given slug
export function getAdjacentCollections(slug: string): {
  prev: Collection | null
  next: Collection | null
} {
  const idx = COLLECTIONS.findIndex((c) => c.slug === slug)
  return {
    prev: idx > 0 ? (COLLECTIONS[idx - 1] ?? null) : null,
    next: idx < COLLECTIONS.length - 1 ? (COLLECTIONS[idx + 1] ?? null) : null,
  }
}
