/** What one person owes, broken down by component. */
export interface PersonShare {
  personId: string
  name: string
  /** Sum of this person's portion of every item they were assigned. */
  itemSubtotal: number
  vat: number
  taxes: number
  serviceCharge: number
  otherCharges: number
  /** itemSubtotal plus this person's portion of every charge. */
  total: number
}

export interface SplitResult {
  shares: PersonShare[]
  /** Sum of every item line, including items nobody is assigned to. */
  itemsSubtotal: number
  /** Sum of item lines with at least one person assigned. */
  assignedSubtotal: number
  /** Sum of item lines nobody is assigned to; excluded from the split. */
  unassignedSubtotal: number
  /** assignedSubtotal plus all charges, i.e. the amount actually divided up. */
  allocatedTotal: number
  /** Sum of the rounded per-person totals. Equals allocatedTotal after reconciliation. */
  splitTotal: number
}
