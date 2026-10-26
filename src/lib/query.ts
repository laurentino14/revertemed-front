import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { api, errorMessage } from './api'
import { toast } from '#/stores/ui'

type Query = Record<string, string | number | boolean | undefined | null>

/** Suspense-enabled GET. The query key is the path plus its params, so filters in the URL refetch automatically. */
export function useGet<T>(path: string, query?: Query) {
  return useSuspenseQuery({
    queryKey: [path, query ?? {}],
    queryFn: ({ signal }) => api<T>(path, { query, signal }),
  }).data
}

export function useGetQuery<T>(path: string, query?: Query) {
  return useSuspenseQuery({
    queryKey: [path, query ?? {}],
    queryFn: ({ signal }) => api<T>(path, { query, signal }),
  })
}

interface ActOptions<TOut> {
  /** Path prefixes whose cached queries become stale after the mutation. */
  invalidate?: string[]
  success?: string
  onSuccess?: (out: TOut) => void
}

/** Mutation wrapper: invalidates related queries, toasts success/failure. */
export function useAct<TIn, TOut = unknown>(
  fn: (input: TIn) => Promise<TOut>,
  opts: ActOptions<TOut> = {},
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async (out) => {
      for (const prefix of opts.invalidate ?? []) {
        await qc.invalidateQueries({
          predicate: (q) =>
            typeof q.queryKey[0] === 'string' &&
            q.queryKey[0].startsWith(prefix),
        })
      }
      if (opts.success) toast.success(opts.success)
      opts.onSuccess?.(out)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
}

export type { QueryKey }
