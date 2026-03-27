"use client"

import React, { useEffect, useRef, useState } from "react"
import { InertiaOptions, motion } from "motion/react"

type InitialPosition = {
  x?: number | string
  y?: number | string
  rotate?: number
}

type DragElementsProps = {
  children: React.ReactNode
  /** Per-child initial positions applied as Framer Motion style (x/y/rotate).
   *  Using style instead of a CSS transform on the child keeps the motion.div's
   *  hit area correctly aligned with the visual position. */
  initialPositions?: InitialPosition[]
  dragElastic?:
    | number
    | { top?: number; left?: number; right?: number; bottom?: number }
    | boolean
  dragConstraints?:
    | { top?: number; left?: number; right?: number; bottom?: number }
    | React.RefObject<Element | null>
  dragMomentum?: boolean
  dragTransition?: InertiaOptions
  dragPropagation?: boolean
  selectedOnTop?: boolean
  className?: string
}

const DragElements: React.FC<DragElementsProps> = ({
  children,
  initialPositions,
  dragElastic = 0.5,
  dragConstraints,
  dragMomentum = true,
  dragTransition = { bounceStiffness: 200, bounceDamping: 300 },
  dragPropagation = true,
  selectedOnTop = true,
  className,
}) => {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [zIndices, setZIndices] = useState<number[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setZIndices(
      Array.from({ length: React.Children.count(children) }, (_, i) => i)
    )
  }, [children])

  const bringToFront = (index: number) => {
    if (selectedOnTop) {
      setZIndices((prev) => {
        const next = [...prev]
        const cur = next.indexOf(index)
        next.splice(cur, 1)
        next.push(index)
        return next
      })
    }
  }

  return (
    <div ref={constraintsRef} className={`relative w-full h-full ${className}`}>
      {React.Children.map(children, (child, index) => {
        const initPos = initialPositions?.[index]
        return (
          <motion.div
            key={index}
            drag
            dragElastic={dragElastic}
            dragConstraints={dragConstraints || constraintsRef}
            dragMomentum={dragMomentum}
            dragTransition={dragTransition}
            dragPropagation={dragPropagation}
            style={{
              x:      initPos?.x,
              y:      initPos?.y,
              rotate: initPos?.rotate,
              zIndex: zIndices.indexOf(index),
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onDragStart={() => {
              bringToFront(index)
              setIsDragging(true)
            }}
            onDragEnd={() => setIsDragging(false)}
            whileDrag={{ cursor: "grabbing" }}
            className="absolute"
          >
            {child}
          </motion.div>
        )
      })}
    </div>
  )
}

export default DragElements
