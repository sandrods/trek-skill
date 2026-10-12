export type Cycle = { id: string; name: string; status: string; artifacts: string }

export type Question = { id: string; owner: string; text: string; isOpen: boolean }

export type LedgerRow = { id: string; task: string; status: string; commit: string; note: string }

// `branches` are the names its Artifacts lines give as branch `<name>`.
export type TrekRecord = { title: string; status: string; cycles: Cycle[]; questions: Question[]; branches: string[] }

// One trek folder as read from disk. `ledger` is the lead cycle's: null when its plan
// has no ledger table, undefined when no plan was found or no cycle is in flight.
export type Trek = TrekRecord & {
  topic: string
  // Its record names the branch the checkout is on: the band shows only such treks.
  isCurrent: boolean
  lead?: Cycle
  planFile?: string
  ledger?: LedgerRow[] | null
}

declare module 'claude-code' {
  interface PluginState {
    trek: { treks: Trek[] }
  }
}
