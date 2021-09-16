import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

interface IScreen {
  id: string
  path: string
  Component: React.ComponentType
}

interface IScreenMap {
  [key: string]: IScreen | undefined
}

const ScreensContext = createContext<{
  screens: IScreenMap
  registerScreen: (screen: IScreen) => () => void
}>(null as any)

export const ScreensProvider: React.FC = (props) => {
  const [screens, setScreens] = useState<IScreenMap>({})

  const registerScreen = useCallback((screen: IScreen) => {
    setScreens((screens) => ({
      ...screens,
      [screen.id]: screen,
    }))

    const unregister = () => {
      setScreens((screens) => ({
        ...screens,
        [screen.id]: undefined,
      }))
    }

    return unregister
  }, [])

  const value = useMemo(
    () => ({
      screens,
      registerScreen,
    }),
    [screens, registerScreen]
  )

  return (
    <ScreensContext.Provider value={value}>
      {props.children}
    </ScreensContext.Provider>
  )
}

export function useScreens() {
  return useContext(ScreensContext)
}