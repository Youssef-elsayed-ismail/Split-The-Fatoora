export const paths = {
  home: '/',
  review: '/review',
  people: '/people',
  assign: '/assign',
  results: '/results',
} as const

export interface FlowStep {
  path: string
  label: string
}

/** The four steps after Home, in order. Drives the progress bar and the step count. */
export const flowSteps: FlowStep[] = [
  { path: paths.review, label: 'Receipt' },
  { path: paths.people, label: 'People' },
  { path: paths.assign, label: 'Assign' },
  { path: paths.results, label: 'Results' },
]

/** 1-based position of a path in the flow, or 0 for Home. */
export function stepNumber(pathname: string): number {
  return flowSteps.findIndex((step) => step.path === pathname) + 1
}
