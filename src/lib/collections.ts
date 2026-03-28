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
    slug: "blackAndWhite",
    name: "Black & White",
    description: "Stripped to essentials",
    coverPhoto: "/photos/blackAndWhite/cover.jpg",
    photos: [
      "/photos/blackAndWhite/2.jpg",
      "/photos/blackAndWhite/3.jpg",
      "/photos/blackAndWhite/4.jpg",
      "/photos/blackAndWhite/5.jpg",
      "/photos/blackAndWhite/6.jpg",
      "/photos/blackAndWhite/7.jpg",
      "/photos/blackAndWhite/8.jpg",
      "/photos/blackAndWhite/9.jpg",
      "/photos/blackAndWhite/10.jpg",
      "/photos/blackAndWhite/11.jpg",
      "/photos/blackAndWhite/12.jpg",
      "/photos/blackAndWhite/13.jpg",
      "/photos/blackAndWhite/14.jpg",
    ],
  },
  {
    slug: "cowries",
    name: "Cowries",
    description: "Ocean's currency",
    coverPhoto: "/photos/cowries/1.jpg",
    photos: [
      "/photos/cowries/1.jpg",
      "/photos/cowries/2.jpg",
      "/photos/cowries/3..jpg",
      "/photos/cowries/4.jpg",
      "/photos/cowries/5.jpg",
      "/photos/cowries/6.jpg",
      "/photos/cowries/7.jpg",
      "/photos/cowries/8.jpg",
      "/photos/cowries/9.jpg",
      "/photos/cowries/10.jpg",
      "/photos/cowries/11.jpg",
    ],
  },
  {
    slug: "desertSoul",
    name: "Desert Soul",
    description: "The sweeping dunes",
    coverPhoto: "/photos/desertSoul/cover.jpg",
    photos: [
      "/photos/desertSoul/1.jpg",
      "/photos/desertSoul/2.jpg",
      "/photos/desertSoul/3.jpg",
      "/photos/desertSoul/5.jpg",
      "/photos/desertSoul/6.jpg",
      "/photos/desertSoul/7.jpg",
      "/photos/desertSoul/54.jpg",
    ],
  },
  {
    slug: "framedByTheWinds",
    name: "Framed By The Winds",
    description: "Wind-carved moments",
    coverPhoto: "/photos/framedByTheWinds/cover.jpg",
    photos: [
      "/photos/framedByTheWinds/50.jpg",
      "/photos/framedByTheWinds/51.jpg",
      "/photos/framedByTheWinds/52.jpg",
      "/photos/framedByTheWinds/53.jpg",
      "/photos/framedByTheWinds/54.jpg",
      "/photos/framedByTheWinds/55.jpg",
      "/photos/framedByTheWinds/56.jpg",
    ],
  },
  {
    slug: "ghoose",
    name: "Ghoose",
    description: "Flights of fancy",
    coverPhoto: "/photos/ghoose/cover.jpg",
    photos: [
      "/photos/ghoose/1.jpg",
      "/photos/ghoose/2.jpg",
      "/photos/ghoose/3.jpg",
      "/photos/ghoose/4.jpg",
      "/photos/ghoose/5.jpg",
      "/photos/ghoose/6.jpg",
      "/photos/ghoose/7.jpg",
    ],
  },
  {
    slug: "lostBoat",
    name: "Lost Boat",
    description: "Adrift in time",
    coverPhoto: "/photos/lostBoat/cover.jpg",
    photos: [
      "/photos/lostBoat/1.jpg",
      "/photos/lostBoat/2.jpg",
      "/photos/lostBoat/3.jpg",
      "/photos/lostBoat/4.jpg",
      "/photos/lostBoat/5.jpg",
    ],
  },
  {
    slug: "shimmering",
    name: "Shimmering",
    description: "Dancing reflections",
    coverPhoto: "/photos/shimmering/cover.jpg",
    photos: [
      "/photos/shimmering/0.jpg",
      "/photos/shimmering/1.jpg",
      "/photos/shimmering/2.jpg",
      "/photos/shimmering/3.jpg",
      "/photos/shimmering/4.jpg",
      "/photos/shimmering/5.jpg",
      "/photos/shimmering/6.jpg",
      "/photos/shimmering/7.jpg",
      "/photos/shimmering/8.jpg",
    ],
  },
  {
    slug: "sunnyDay",
    name: "Sunny Day",
    description: "Basking in the light",
    coverPhoto: "/photos/sunnyDay/cover.jpg",
    photos: [
      "/photos/sunnyDay/06.jpg",
      "/photos/sunnyDay/2.jpg",
      "/photos/sunnyDay/3.jpg",
      "/photos/sunnyDay/4.jpg",
      "/photos/sunnyDay/5.jpg",
      "/photos/sunnyDay/6.jpg",
      "/photos/sunnyDay/7.jpg",
      "/photos/sunnyDay/8.jpg",
      "/photos/sunnyDay/9.jpg",
      "/photos/sunnyDay/10.jpg",
      "/photos/sunnyDay/12.jpg",
    ],
  },
  {
    slug: "brokenCar",
    name: "Broken Car",
    description: "Rust and memories",
    coverPhoto: "/photos/brokenCar/cover.jpg",
    photos: [
      "/photos/brokenCar/2.jpg",
      "/photos/brokenCar/3.jpg",
      "/photos/brokenCar/4.jpg",
      "/photos/brokenCar/5.jpg",
      "/photos/brokenCar/6.jpg",
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
