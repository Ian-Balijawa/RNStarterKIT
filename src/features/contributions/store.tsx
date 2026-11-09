import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppState } from 'react-native'
import { usePersistedState } from '../../hooks/usePersistedState'
import { preferences } from '../../services/storage/mmkv'
import { ContributionsData, EMPTY_DATA, kampalaDate } from './model'
import { allocateData } from './derived'

type Update = React.SetStateAction<ContributionsData>
type ContributionsContextValue = {
  data: ContributionsData
  setData: (update: Update) => void
}

const ContributionsContext = createContext<ContributionsContextValue | null>(
  null,
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasStrings(value: Record<string, unknown>, keys: string[]) {
  return keys.every(key => typeof value[key] === 'string')
}

/** Keep a damaged or older local value from crashing the whole app at startup. */
export function readContributions(value: unknown): ContributionsData {
  if (!isRecord(value)) return EMPTY_DATA
  const records = (
    key: string,
    valid: (item: Record<string, unknown>) => boolean,
  ) =>
    Array.isArray(value[key])
      ? value[key].filter((item: unknown) => isRecord(item) && valid(item))
      : []
  return {
    churches: records('churches', item =>
      hasStrings(item, ['id', 'name', 'location']),
    ) as ContributionsData['churches'],
    members: records(
      'members',
      item =>
        hasStrings(item, ['id', 'name', 'phone']) &&
        (item.churchId === undefined || typeof item.churchId === 'string'),
    ) as ContributionsData['members'],
    projects: records(
      'projects',
      item =>
        hasStrings(item, ['id', 'name', 'description']) &&
        typeof item.targetAmount === 'number' &&
        Number.isFinite(item.targetAmount) &&
        Array.isArray(item.churchIds) &&
        item.churchIds.every(id => typeof id === 'string'),
    ) as ContributionsData['projects'],
    pledges: records(
      'pledges',
      item =>
        hasStrings(item, ['id', 'memberId', 'projectId', 'startDate']) &&
        typeof item.amount === 'number' &&
        Number.isFinite(item.amount) &&
        (item.frequency === 'daily' ||
          item.frequency === 'weekly' ||
          item.frequency === 'monthly'),
    ) as ContributionsData['pledges'],
    contributions: records(
      'contributions',
      item =>
        hasStrings(item, ['id', 'memberId', 'paidAt']) &&
        typeof item.amount === 'number' &&
        Number.isFinite(item.amount) &&
        (item.churchId === undefined || typeof item.churchId === 'string'),
    ) as ContributionsData['contributions'],
  }
}

export function ContributionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [stored, setStored] = usePersistedState<unknown>(
    preferences,
    'contributions-v1',
    EMPTY_DATA,
  )
  const [today, setToday] = useState(kampalaDate)
  useEffect(() => {
    const refresh = () => setToday(kampalaDate())
    const timer = setInterval(refresh, 60000)
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh()
    })
    return () => {
      clearInterval(timer)
      subscription.remove()
    }
  }, [])
  const data = useMemo(
    () => allocateData(readContributions(stored), today),
    [stored, today],
  )
  const setData = useCallback(
    (update: Update) => {
      setStored((current: unknown) => {
        const safe = readContributions(current)
        return typeof update === 'function' ? update(safe) : update
      })
    },
    [setStored],
  )
  const value = useMemo(() => ({ data, setData }), [data, setData])
  return (
    <ContributionsContext.Provider value={value}>
      {children}
    </ContributionsContext.Provider>
  )
}

export function useContributions() {
  const value = useContext(ContributionsContext)
  if (!value)
    throw new Error(
      'useContributions must be used within ContributionsProvider',
    )
  return value
}
