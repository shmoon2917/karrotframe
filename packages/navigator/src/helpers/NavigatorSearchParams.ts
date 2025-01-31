enum K {
  SCREEN_INSTANCE_ID = '_si',
  IS_PRESENT = '_present',
}

export function makeNavigatorSearchParams(
  init: string | string[][] | Record<string, string> | URLSearchParams | null,
  {
    screenInstanceId,
    present,
  }: {
    screenInstanceId?: string
    present?: boolean
  }
) {
  const searchParams = new URLSearchParams(init ?? undefined)

  if (screenInstanceId) {
    searchParams.set(K.SCREEN_INSTANCE_ID, screenInstanceId)
  }

  if (present) {
    searchParams.set(K.IS_PRESENT, 'true')
  } else {
    searchParams.delete(K.IS_PRESENT)
  }

  return {
    toString: () => searchParams.toString(),
    toObject: () => ({
      screenInstanceId,
      present: !!present,
    }),
  }
}

export function parseNavigatorSearchParams(
  init: string | string[][] | Record<string, string> | URLSearchParams
) {
  const searchParams = new URLSearchParams(init)

  const screenInstanceId = searchParams.get(K.SCREEN_INSTANCE_ID) ?? undefined
  const present = searchParams.get(K.IS_PRESENT) === 'true'

  return makeNavigatorSearchParams(null, {
    screenInstanceId,
    present,
  })
}
