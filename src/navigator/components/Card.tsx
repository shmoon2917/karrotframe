import React from 'react'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import Navbar from './Navbar'
import { useNavigatorOptions } from '../contexts/ContextNavigatorOptions'
import { Environment } from '../../types'
import { useRecoilState } from 'recoil'
import { AtomScreenEdge } from '../atoms/ScreenEdge'
import { useHistory } from 'react-router-dom'
import { AtomScreenInstances } from '../atoms/ScreenInstances'

interface CardProps {
  screenInstanceId: string
  isNavbar: boolean
  isRoot: boolean
  isTop: boolean
  isUnderTop: boolean
  onClose: () => void
}
const Card: React.FC<CardProps> = (props) => {
  const history = useHistory()

  const navigator = useNavigatorOptions()

  const [screenInstances] = useRecoilState(AtomScreenInstances)
  const [screenEdge, setScreenEdge] = useRecoilState(AtomScreenEdge)
  
  const screenInstance = screenInstances.find((instance) => instance.id === props.screenInstanceId)

  const onEdgeTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setScreenEdge({
      ...screenEdge,
      startX: e.touches[0].clientX,
      startTime: Date.now(),
    })
  }

  const onEdgeTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (screenEdge.startX) {
      const computedEdgeX = e.touches[0].clientX - screenEdge.startX
      if (computedEdgeX >= 0) {
        setScreenEdge({
          ...screenEdge,
          x: computedEdgeX,
        })
      } else {
        setScreenEdge({
          ...screenEdge,
          x: 0,
        })
      }
    }
  }

  const onEdgeTouchEnd = () => {
    const velocity = screenEdge.x / (Date.now() - (screenEdge.startTime as number))

    if (velocity > 1 || screenEdge.x / window.screen.width > 0.4) {
      history.goBack()
    }

    setScreenEdge({
      x: 0,
      startX: null,
      startTime: null,
    })
  }

  return (
    <Container
      environment={navigator.environment}
      navbarVisible={!!screenInstance?.navbar.visible}
    >
      {!!screenInstance?.navbar.visible &&
        <Navbar
          screenInstanceId={props.screenInstanceId}
          environment={navigator.environment}
          isRoot={props.isRoot}
          onClose={props.onClose}
        />
      }
      <Dim
        className='kf-dim'
        isTop={props.isTop}
        animationDuration={navigator.animationDuration}
        style={{
          backgroundColor:
            screenEdge.startX !== null && props.isTop
              ? `rgba(0, 0, 0, ${
                  0.2 - (screenEdge.x / window.screen.width) * 0.2
                })`
              : undefined,
          transform:
            screenEdge.startX !== null && !props.isTop
              ? `translateX(-${
                  2 - (2 * screenEdge.x) / window.screen.width
                }rem)`
              : undefined,
          transition: screenEdge.startX !== null ? `0s` : undefined,
        }}
      >
        <FrameContainer
          className='kf-frame-container'
          isRoot={props.isRoot}
          animationDuration={navigator.animationDuration}
          style={{
            overflowY: screenEdge.startX !== null ? 'hidden' : undefined,
            transform:
              screenEdge.startX !== null && props.isTop
                ? `translateX(${screenEdge.x}px)`
                : undefined,
            transition:
              screenEdge.startX !== null && props.isTop
                ? `transform 0s`
                : undefined,
          }}
        >
          <Frame>
            {props.children}
          </Frame>
          {navigator.environment ==='Cupertino' && !props.isRoot &&
            <Edge
              onTouchStart={onEdgeTouchStart}
              onTouchMove={onEdgeTouchMove}
              onTouchEnd={onEdgeTouchEnd}
            />
          }
        </FrameContainer>
      </Dim>
    </Container>
  )
}

interface DimProps {
  isTop: boolean
  animationDuration: number
}
const Dim = styled.div<DimProps>`
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  transform: translateX(-2rem);
  transition: background-color ${(props) => props.animationDuration}ms,
    transform ${(props) => props.animationDuration}ms;

  ${(props) =>
    props.isTop &&
    css`
      transform: translateX(0);
    `}
`

interface FrameContainerProps {
  isRoot: boolean
  animationDuration: number
}
const FrameContainer = styled.div<FrameContainerProps>`
  width: 100%;
  height: 100%;
  transition: transform ${(props) => props.animationDuration}ms;
  transform: translateX(0);
  overflow-y: scroll;
  background-color: #fff;

  ${(props) =>
    !props.isRoot &&
    css`
      transform: translateX(100%);
    `};
`

const Frame = styled.div`
  width: 100%;
  min-height: 100%;
`

const Edge = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 1.25rem;
`

interface ContainerProps {
  navbarVisible?: boolean,
  environment: Environment
}
const Container = styled.div<ContainerProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  
  ${(props) => {
    if (!props.navbarVisible) {
      return css``
    }

    switch (props.environment) {
      case 'Cupertino':
        return css`
          padding-top: 2.75rem;
        `
      case 'Android':
      case 'Web':
        return css`
          padding-top: 3.5rem;
        `
    }
  }}

  &.enter-active, &.enter-done {
    .kf-dim {
      background-color: rgba(0, 0, 0, 0.2);
    }
    .kf-frame-container {
      transform: translateX(0);
    }
  }
  &.exit-active {
    .kf-dim {
      background-color: rgba(0, 0, 0, 0);
    }
    .kf-frame-container {
      transform: translateX(100%);
    }
    .kf-navbar-container {
      opacity: 0;
    }
  }
`

export default Card
