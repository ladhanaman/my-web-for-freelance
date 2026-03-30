import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
} from "react"

export const preventMediaContextMenu = (
  event: ReactMouseEvent<HTMLElement>
): void => {
  event.preventDefault()
}

export const preventMediaDragStart = (
  event: ReactDragEvent<HTMLElement>
): void => {
  event.preventDefault()
}
