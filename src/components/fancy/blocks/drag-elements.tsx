"use client"

import React, { useEffect, useRef, useState } from "react"

type InitialPosition = {
  top?: number | string
  left?: number | string
  x?: number | string
  y?: number | string
  rotate?: number | string
}

type DragElementsProps = {
  children: React.ReactNode
  initialPositions?: InitialPosition[]
  dragElastic?:
    | number
    | { top?: number; left?: number; right?: number; bottom?: number }
    | boolean
  dragConstraints?:
    | { top?: number; left?: number; right?: number; bottom?: number }
    | React.RefObject<Element | null>
  dragMomentum?: boolean
  dragTransition?: unknown
  dragPropagation?: boolean
  selectedOnTop?: boolean
  className?: string
  /** localStorage key — when provided, drag positions and z-order are persisted across sessions */
  storageKey?: string
}

type DragOffset = {
  x: number
  y: number
}

type DragBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type ActiveDrag = {
  bounds: DragBounds | null
  index: number
  originX: number
  originY: number
  startX: number
  startY: number
}

const resolveNumericOffset = (value?: number | string): number =>
  typeof value === "number" ? value : 0

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const resolveRotate = (value?: number | string): string =>
  value === undefined ? "" : typeof value === "number" ? `${value}deg` : value

type PersistedLayout = { offsets: DragOffset[]; zIndices: number[] }

// loadLayout logic merged into useEffect

function saveLayout(key: string, offsets: DragOffset[], zIndices: number[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ offsets, zIndices }))
  } catch {}
}

const DragElements: React.FC<DragElementsProps> = ({
  children,
  initialPositions,
  dragConstraints,
  selectedOnTop = true,
  className,
  storageKey,
}) => {
  const childCount = React.Children.count(children)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const activeDragRef = useRef<ActiveDrag | null>(null)

  const [zIndices, setZIndices] = useState<number[]>(() =>
    Array.from({ length: childCount }, (_, index) => index)
  )
  const [offsets, setOffsets] = useState<DragOffset[]>(() =>
    Array.from({ length: childCount }, (_, index) => ({
      x: resolveNumericOffset(initialPositions?.[index]?.x),
      y: resolveNumericOffset(initialPositions?.[index]?.y),
    }))
  )
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  // Refs kept in sync so drag-end handler can read latest state without stale closures
  const offsetsRef = useRef(offsets)
  const zIndicesRef = useRef(zIndices)

  useEffect(() => {
    if (!storageKey) return

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as PersistedLayout
      
      if (parsed && Array.isArray(parsed.offsets) && Array.isArray(parsed.zIndices)) {
        const wWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
        const wHeight = typeof window !== 'undefined' ? window.innerHeight : 1080

        const safeOffsets = Array.from({ length: childCount }, (_, i) => {
          const stored = parsed.offsets[i]
          if (stored && typeof stored.x === 'number' && typeof stored.y === 'number') {
            return {
              x: clamp(stored.x, -wWidth, wWidth),
              y: clamp(stored.y, -wHeight, wHeight)
            }
          }
          return {
            x: resolveNumericOffset(initialPositions?.[i]?.x),
            y: resolveNumericOffset(initialPositions?.[i]?.y),
          }
        })

        const safeZIndices = parsed.zIndices.filter(z => z < childCount)
        for (let i = 0; i < childCount; i++) {
          if (!safeZIndices.includes(i)) safeZIndices.push(i)
        }

        setOffsets(safeOffsets)
        setZIndices(safeZIndices)
        offsetsRef.current = safeOffsets
        zIndicesRef.current = safeZIndices
      }
    } catch {}
  }, [storageKey, childCount, initialPositions])

  const bringToFront = (index: number) => {
    if (!selectedOnTop) return

    setZIndices((prev) => {
      const next = [...prev]
      const currentIndex = next.indexOf(index)

      if (currentIndex === -1) {
        next.push(index)
      } else {
        next.splice(currentIndex, 1)
        next.push(index)
      }

      zIndicesRef.current = next
      return next
    })
  }

  const resolveBounds = (
    index: number,
    origin: DragOffset
  ): DragBounds | null => {
    const element = itemRefs.current[index]

    if (!element) return null

    if (dragConstraints && "current" in dragConstraints) {
      const constraintElement = dragConstraints.current

      if (!constraintElement) return null

      const itemRect = element.getBoundingClientRect()
      const constraintRect = constraintElement.getBoundingClientRect()

      return {
        minX: origin.x + (constraintRect.left - itemRect.left),
        maxX: origin.x + (constraintRect.right - itemRect.right),
        minY: origin.y + (constraintRect.top - itemRect.top),
        maxY: origin.y + (constraintRect.bottom - itemRect.bottom),
      }
    }

    if (dragConstraints && typeof dragConstraints === "object") {
      return {
        minX: dragConstraints.left ?? Number.NEGATIVE_INFINITY,
        maxX: dragConstraints.right ?? Number.POSITIVE_INFINITY,
        minY: dragConstraints.top ?? Number.NEGATIVE_INFINITY,
        maxY: dragConstraints.bottom ?? Number.POSITIVE_INFINITY,
      }
    }

    return null
  }

  const updateOffset = (index: number, nextOffset: DragOffset) => {
    setOffsets((prev) => {
      const next = [...prev]
      next[index] = nextOffset
      offsetsRef.current = next
      return next
    })
  }

  const handlePointerDown = (
    index: number,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (event.button !== 0) return

    bringToFront(index)

    const currentOffset = offsets[index] ?? {
      x: resolveNumericOffset(initialPositions?.[index]?.x),
      y: resolveNumericOffset(initialPositions?.[index]?.y),
    }

    activeDragRef.current = {
      bounds: resolveBounds(index, currentOffset),
      index,
      originX: currentOffset.x,
      originY: currentOffset.y,
      startX: event.clientX,
      startY: event.clientY,
    }

    setDraggingIndex(index)
    event.preventDefault()
  }

  useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      const activeDrag = activeDragRef.current

      if (!activeDrag) return

      const deltaX = event.clientX - activeDrag.startX
      const deltaY = event.clientY - activeDrag.startY

      let nextX = activeDrag.originX + deltaX
      let nextY = activeDrag.originY + deltaY

      if (activeDrag.bounds) {
        nextX = clamp(nextX, activeDrag.bounds.minX, activeDrag.bounds.maxX)
        nextY = clamp(nextY, activeDrag.bounds.minY, activeDrag.bounds.maxY)
      }

      updateOffset(activeDrag.index, { x: nextX, y: nextY })
    }

    const handleWindowMouseUp = () => {
      if (!activeDragRef.current) return

      activeDragRef.current = null
      setDraggingIndex(null)

      if (storageKey) {
        saveLayout(storageKey, offsetsRef.current, zIndicesRef.current)
      }
    }

    window.addEventListener("mousemove", handleWindowMouseMove)
    window.addEventListener("mouseup", handleWindowMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove)
      window.removeEventListener("mouseup", handleWindowMouseUp)
    }
  }, [])

  return (
    <div ref={constraintsRef} className={`relative h-full w-full ${className ?? ""}`}>
      {React.Children.map(children, (child, index) => {
        const initPos = initialPositions?.[index]
        const zIndex = zIndices.includes(index) ? zIndices.indexOf(index) : index
        const offset = offsets[index] ?? {
          x: resolveNumericOffset(initPos?.x),
          y: resolveNumericOffset(initPos?.y),
        }
        const rotate = resolveRotate(initPos?.rotate)

        return (
          <div
            key={index}
            ref={(element) => {
              itemRefs.current[index] = element
            }}
            data-dragging={draggingIndex === index ? "true" : "false"}
            suppressHydrationWarning
            style={{
              top: initPos?.top,
              left: initPos?.left,
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0)${rotate ? ` rotate(${rotate})` : ""}`,
              zIndex,
              cursor: draggingIndex === index ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
            }}
            onMouseDown={(event) => handlePointerDown(index, event)}
            className="absolute"
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}

export default DragElements
