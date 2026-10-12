export type Cycle = { id: string; name: string; status: string; artifacts: string }

export type Question = { id: string; owner: string; text: string; isOpen: boolean }

export type LedgerRow = { id: string; task: string; status: string; commit: string; note: string }

export type TrekRecord = { title: string; status: string; cycles: Cycle[]; questions: Question[] }

// One trek folder as read from disk. `ledger` is the lead cycle's: null when its plan
// has no ledger table, undefined when no plan was found or no cycle is in flight.
export type Trek = TrekRecord & {
  topic: string
  // The checkout is on one of its branches, `treks/<topic>/…`: the band shows only it.
  isCurrent: boolean
  lead?: Cycle
  // The lead is the cycle whose branch is checked out, not the furthest-along one.
  isLeadCheckedOut?: boolean
  planFile?: string
  ledger?: LedgerRow[] | null
}

declare module 'claude-code' {
  interface PluginState {
    trek: { treks: Trek[] }
  }
}
