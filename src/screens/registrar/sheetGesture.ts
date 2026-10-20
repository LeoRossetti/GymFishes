/** A long drag or a fast flick down closes the sheet; a flick is intent even when short. */
export function shouldCloseSheet(offsetY: number, velocityY: number): boolean {
  return offsetY > 80 || velocityY > 500
}
