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
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "blackAndWhite",
    name: "Black & White",
    description: "Stripped to essentials",
    coverPhoto: "/photos/blackAndWhite/cover.webp",
    photos: [
      "/photos/blackAndWhite/2.webp",
      "/photos/blackAndWhite/3.webp",
      "/photos/blackAndWhite/4.webp",
      "/photos/blackAndWhite/5.webp",
      "/photos/blackAndWhite/6.webp",
      "/photos/blackAndWhite/7.webp",
      "/photos/blackAndWhite/8.webp",
      "/photos/blackAndWhite/9.webp",
      "/photos/blackAndWhite/10.webp",
      "/photos/blackAndWhite/11.webp",
      "/photos/blackAndWhite/12.webp",
      "/photos/blackAndWhite/13.webp",
      "/photos/blackAndWhite/14.webp",
    ],
  },
  {
    slug: "cowries",
    name: "Cowries",
    description: "Ocean's currency",
    coverPhoto: "/photos/cowries/cover.webp",
    photos: [
      "/photos/cowries/cover.webp",
      "/photos/cowries/1.webp",
      "/photos/cowries/2.webp",
      "/photos/cowries/3..webp",
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
    slug: "desertSoul",
    name: "Desert Soul",
    description: "The sweeping dunes",
    coverPhoto: "/photos/desertSoul/cover.webp",
    photos: [
      "/photos/desertSoul/1.webp",
      "/photos/desertSoul/2.webp",
      "/photos/desertSoul/3.webp",
      "/photos/desertSoul/5.webp",
      "/photos/desertSoul/6.webp",
      "/photos/desertSoul/7.webp",
      "/photos/desertSoul/54.webp",
    ],
  },
  {
    slug: "framedByTheWinds",
    name: "Framed By The Winds",
    description: "Wind-carved moments",
    coverPhoto: "/photos/framedByTheWinds/cover.webp",
    photos: [
      "/photos/framedByTheWinds/50.webp",
      "/photos/framedByTheWinds/51.webp",
      "/photos/framedByTheWinds/52.webp",
      "/photos/framedByTheWinds/53.webp",
      "/photos/framedByTheWinds/54.webp",
      "/photos/framedByTheWinds/55.webp",
      "/photos/framedByTheWinds/56.webp",
    ],
  },
  {
    slug: "ghoose",
    name: "Ghoose",
    description: "Flights of fancy",
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
    slug: "lostBoat",
    name: "Lost Boat",
    description: "Adrift in time",
    coverPhoto: "/photos/lostBoat/cover.webp",
    photos: [
      "/photos/lostBoat/1.webp",
      "/photos/lostBoat/2.webp",
      "/photos/lostBoat/3.webp",
      "/photos/lostBoat/4.webp",
      "/photos/lostBoat/5.webp",
    ],
  },
  {
    slug: "shimmering",
    name: "Shimmering",
    description: "Dancing reflections",
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
    slug: "sunnyDay",
    name: "Sunny Day",
    description: "Basking in the light",
    coverPhoto: "/photos/sunnyDay/cover.webp",
    photos: [
      "/photos/sunnyDay/06.webp",
      "/photos/sunnyDay/2.webp",
      "/photos/sunnyDay/3.webp",
      "/photos/sunnyDay/4.webp",
      "/photos/sunnyDay/5.webp",
      "/photos/sunnyDay/6.webp",
      "/photos/sunnyDay/7.webp",
      "/photos/sunnyDay/8.webp",
      "/photos/sunnyDay/9.webp",
      "/photos/sunnyDay/10.webp",
      "/photos/sunnyDay/12.webp",
    ],
  },
  {
    slug: "brokenCar",
    name: "Broken Car",
    description: "Rust and memories",
    coverPhoto: "/photos/brokenCar/cover.webp",
    photos: [
      "/photos/brokenCar/2.webp",
      "/photos/brokenCar/3.webp",
      "/photos/brokenCar/4.webp",
      "/photos/brokenCar/5.webp",
      "/photos/brokenCar/6.webp",
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
