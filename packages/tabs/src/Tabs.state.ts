export type State = {
  tabCount: number
  activeTabIndex: number
} & (
  | {
      _t: 'idle'
    }
  | {
      _t: 'touch_started'
      x0: number
      y0: number
    }
  | {
      _t: 'swipe_started'
      x0: number
      y0: number
      dx: number
      e: TouchEvent
    }
  | {
      _t: 'swipe_canceled'
    }
)

export type Action =
  | {
      _t: 'TOUCH_START'
      x: number
      y: number
    }
  | {
      _t: 'TOUCH_MOVE'
      x: number
      y: number
      e: TouchEvent
    }
  | {
      _t: 'TOUCH_END'
    }

function reducer(prevState: State, action: Action): State {
  switch (action._t) {
    case 'TOUCH_START': {
      const { x, y } = action

      if (x < 0) {
        return {
          ...prevState,
          _t: 'swipe_canceled',
        }
      }
      if (prevState._t === 'idle') {
        return {
          ...prevState,
          _t: 'touch_started',
          x0: x,
          y0: y,
        }
      }
      return {
        ...prevState,
      }
    }
    case 'TOUCH_MOVE': {
      const { x, y, e } = action

      if (x < 0) {
        return {
          ...prevState,
          _t: 'swipe_canceled',
        }
      }

      if (prevState._t === 'idle') {
        return {
          ...prevState,
          _t: 'touch_started',
          x0: x,
          y0: y,
        }
      }
      if (prevState._t === 'touch_started') {
        const { x0, y0 } = prevState
        const dx = x - x0
        const dy = y - y0

        const distance = Math.sqrt(
          Math.pow(Math.abs(dx), 2) + Math.pow(Math.abs(dy), 2)
        )

        if (distance < 10 || distance > 50) {
          return {
            ...prevState,
          }
        }
        if (Math.abs(dy) / Math.abs(dx) < 0.5) {
          return {
            ...prevState,
            _t: 'swipe_started',
            dx: 0,
            e,
          }
        } else {
          return {
            ...prevState,
            _t: 'swipe_canceled',
          }
        }
      }
      if (prevState._t === 'swipe_started') {
        const { x0 } = prevState

        return {
          ...prevState,
          dx: x - x0,
        }
      }

      return {
        ...prevState,
      }
    }
    case 'TOUCH_END': {
      if (prevState._t === 'swipe_started') {
        const { activeTabIndex, tabCount, dx } = prevState

        const hasNextTab = activeTabIndex < tabCount - 1
        const hasPreviousTab = activeTabIndex > 0

        if (dx < -100 && hasNextTab) {
          return {
            ...prevState,
            _t: 'idle',
            activeTabIndex: activeTabIndex + 1,
          }
        }
        if (dx >= 100 && hasPreviousTab) {
          return {
            ...prevState,
            _t: 'idle',
            activeTabIndex: activeTabIndex - 1,
          }
        }
      }

      return {
        ...prevState,
        _t: 'idle',
      }
    }
  }
}

export function makeState(initialState: State) {
  const state: State = {
    ...initialState,
  }
  let effects: Array<(state: State) => void> = []

  return {
    state,
    dispatch(action: Action) {
      Object.assign(state, reducer(state, action))
      effects.forEach((effect) => effect(state))
    },
    addEffect(effect: (state: State) => void) {
      effects.push(effect)

      return () => {
        const i = effects.indexOf(effect)
        if (i >= 0) {
          effects.splice(i, 1)
        }
      }
    },
  }
}
