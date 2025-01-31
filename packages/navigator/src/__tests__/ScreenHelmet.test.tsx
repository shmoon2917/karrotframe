import React from 'react'
import type { FC, ReactElement } from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'

import ScreenHelmet from '../ScreenHelmet'
import Navigator from '../Navigator'
import Screen from '../Screen'
import { useNavigator } from '../useNavigator'

const noop = () => {}

describe('ScreenHelmet - visible: ', () => {
  const renderScreenHelmet = ({
    visible,
  }: {
    visible: boolean
  }): RenderResult => {
    const Example: FC = (): ReactElement => {
      return (
        <div>
          <ScreenHelmet visible={visible} />
          <span>example</span>
        </div>
      )
    }

    return render(
      <Navigator onClose={noop}>
        <Screen path="/" component={Example} />
      </Navigator>
    )
  }

  it('visible: false 이면 navbar 가 나타나지 않는다', () => {
    const { asFragment } = renderScreenHelmet({ visible: false })
    expect(asFragment()).toMatchSnapshot()
  })

  it('visible: true 이면 navbar 가 나타난다', () => {
    const { asFragment } = renderScreenHelmet({ visible: true })
    expect(asFragment()).toMatchSnapshot()
  })
})

describe('ScreenHelmet - preventSwipeBack:  ', () => {
  const renderScreenHelmet = ({
    preventSwipeBack,
  }: {
    preventSwipeBack: boolean
  }): RenderResult => {
    const Example: FC = (): ReactElement => {
      const { push } = useNavigator()

      return (
        <div>
          <ScreenHelmet preventSwipeBack={preventSwipeBack} />
          <span>example</span>
          <button
            onClick={() => {
              push('/another')
            }}
          >
            move
          </button>
        </div>
      )
    }
    const Another: FC = (): ReactElement => {
      const { push } = useNavigator()

      return (
        <div>
          <ScreenHelmet preventSwipeBack={preventSwipeBack} />
          <span>another</span>
          <button
            onClick={() => {
              push('/')
            }}
          >
            teardown
          </button>
        </div>
      )
    }

    return render(
      <Navigator onClose={noop} theme="Cupertino">
        <Screen path="/" component={Example} />
        <Screen path="/another" component={Another} />
      </Navigator>
    )
  }

  afterEach(async () => {
    try {
      await waitFor(() => {
        const teardownButton = screen.queryByText(/teardown/i)
        if (teardownButton) {
          fireEvent.click(teardownButton)
        }
      })
    } catch (e) {
      console.error(e)
    }
  })

  it('preventSwipeBack: true 이면 edge element 를 생성하지 않는다 ', async () => {
    // when
    const { getByText, queryByTestId } = renderScreenHelmet({
      preventSwipeBack: true,
    })
    const moveButton = getByText(/move/i)
    fireEvent.click(moveButton)

    // then
    await waitFor(() => {
      const edgeElement = queryByTestId('edge-element')
      expect(edgeElement).not.toBeInTheDocument()
    })
  })

  it('preventSwipeBack: false 이면 edge element 를 생성한다. ', async () => {
    // when
    const { getByText, findByTestId } = renderScreenHelmet({
      preventSwipeBack: false,
    })
    const moveButton = getByText(/move/i)
    fireEvent.click(moveButton)

    // then
    const edgeElement = await findByTestId('edge-element')
    expect(edgeElement).toBeInTheDocument()
  })
})

describe('ScreenHelmet - noBackButton, noCloseButton: ', () => {
  const renderScreenHelmet = ({
    noBackButton,
    noCloseButton,
  }: {
    noBackButton?: boolean
    noCloseButton?: boolean
  }): RenderResult => {
    const HomeWithoutButton: FC = (): ReactElement => {
      const { push } = useNavigator()

      return (
        <div>
          <ScreenHelmet noCloseButton />
          <button
            onClick={() => {
              push('/another')
            }}
          >
            move
          </button>
        </div>
      )
    }

    const Home: FC = (): ReactElement => {
      const { push } = useNavigator()

      return (
        <div>
          <ScreenHelmet />
          <button
            onClick={() => {
              push('/another')
            }}
          >
            move
          </button>
        </div>
      )
    }

    const Another: FC = (): ReactElement => {
      const { push } = useNavigator()

      return (
        <div>
          <ScreenHelmet />
          <span>another</span>
          <button
            onClick={() => {
              push('/')
            }}
          >
            teardown
          </button>
        </div>
      )
    }

    const AnotherWithoutButton: FC = (): ReactElement => {
      const { push } = useNavigator()

      return (
        <div>
          <ScreenHelmet noBackButton />
          <span>another</span>
          <button
            onClick={() => {
              push('/')
            }}
          >
            teardown
          </button>
        </div>
      )
    }

    return render(
      <Navigator
        onClose={() => {
          console.log('ScreenHelmet test')
        }}
        backButtonAriaLabel="BackButtonTest"
        closeButtonAriaLabel="CloseButtonTest"
      >
        <Screen path="/" component={noCloseButton ? HomeWithoutButton : Home} />
        <Screen
          path="/another"
          component={noBackButton ? AnotherWithoutButton : Another}
        />
      </Navigator>
    )
  }

  it('noCloseButton 가 false 이면, root 에서 close button 이 나타난다.', () => {
    // when
    const { getByLabelText } = renderScreenHelmet({ noCloseButton: false })

    // then
    const closeButtonNotRendering = getByLabelText('CloseButtonTest')
    expect(closeButtonNotRendering).toBeInTheDocument()
  })

  it('noCloseButton 가 true 이면, root 에서 close button 이 나타나지 않는다.', () => {
    // when
    const { queryByLabelText } = renderScreenHelmet({ noCloseButton: true })

    // then
    const closeButtonNotRendering = queryByLabelText('CloseButtonTest')
    expect(closeButtonNotRendering).not.toBeInTheDocument()
  })

  it('noBackButton 가 false 이면, root 가 아닐 때 back button 이 나타난다.', async () => {
    // given
    const { findByLabelText, getByText, findByText } = renderScreenHelmet({
      noBackButton: false,
    })

    try {
      // when
      const moveButton = getByText(/move/i)
      fireEvent.click(moveButton)

      // then
      const closeButtonNotRendering = await findByLabelText('BackButtonTest')
      expect(closeButtonNotRendering).toBeInTheDocument()
    } finally {
      // use waitFor to avoid warning message 'When testing, code that causes React state updates should be wrapped into act
      await waitFor(async () => {
        // teardown
        const teardownButton = await findByText('teardown')
        fireEvent.click(teardownButton)
      })
    }
  })

  it('noBackButton 가 true 이면, root 가 아닐 때 back button 이 나타나지 않는다.', async () => {
    // given
    const { getByText, findByText, findByLabelText } = renderScreenHelmet({
      noBackButton: true,
    })

    try {
      // when
      const moveButton = getByText(/move/i)
      fireEvent.click(moveButton)

      // then
      await expect(
        findByLabelText('BackButtonTest', {}, { timeout: 300 })
      ).rejects.toThrow()
    } finally {
      // use waitFor to avoid warning message 'When testing, code that causes React state updates should be wrapped into act
      await waitFor(async () => {
        // teardown
        const teardownButton = await findByText('teardown')
        fireEvent.click(teardownButton)
      })
    }
  })
})
