let counter = 0

/** Short unique id, good enough for client-only session state. */
export function createId(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}
