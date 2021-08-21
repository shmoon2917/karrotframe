import React, { useCallback, useEffect, useRef, useState } from 'react'
import zenscroll from 'zenscroll'

import { useNavigatorOptions } from '../contexts'
import { useStore, useStoreActions, useStoreSelector } from '../store'
import { useNavigator } from '../useNavigator'
import {
  cardDim,
  cardEdge,
  cardFrame,
  cardFrameOffset,
  cardMain,
  cardMainOffset,
  cardTransitionNode,
} from './Card.css'
import Navbar from './Navbar'

const $frameOffsetSet = new Set<HTMLDivElement>()

interface CardProps {
  nodeRef: React.RefObject<HTMLDivElement>
  screenPath: string
  screenInstanceId: string
  isRoot: boolean
  isTop: boolean
  isPresent: boolean
  onClose?: () => void
}
const Card: React.FC<CardProps> = (props) => {
  const navigator = useNavigator()
  const navigatorOptions = useNavigatorOptions()

  const android = navigatorOptions.theme === 'Android'
  const cupertino = navigatorOptions.theme === 'Cupertino'

  const [popped, setPopped] = useState(false)

  const store = useStore()
  const { screenEdge, screenInstanceOptions } = useStoreSelector((state) => ({
    screenEdge: state.screenEdge,
    screenInstanceOptions: state.screenInstanceOptions,
  }))
  const { setScreenEdge } = useStoreActions()

  const x = useRef<number>(0)
  const requestAnimationFrameLock = useRef<boolean>(false)

  const dimRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const frameOffsetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const $frameOffset = frameOffsetRef.current

    if ($frameOffset) {
      $frameOffsetSet.add($frameOffset)

      return () => {
        $frameOffsetSet.delete($frameOffset)
      }
    }
  }, [frameOffsetRef.current])

  const onEdgeTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      ;(document.activeElement as any)?.blur?.()

      setScreenEdge({
        screenEdge: {
          startX: e.touches[0].clientX,
          startTime: Date.now(),
        },
      })
    },
    []
  )

  const onEdgeTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (screenEdge.startX) {
        x.current = e.touches[0].clientX

        if (!requestAnimationFrameLock.current) {
          requestAnimationFrameLock.current = true

          requestAnimationFrame(() => {
            if (x.current > 0) {
              const computedEdgeX = x.current - screenEdge.startX!

              const $dim = dimRef.current
              const $frame = frameRef.current

              if (computedEdgeX >= 0) {
                if ($dim) {
                  $dim.style.opacity = `${
                    1 - computedEdgeX / window.screen.width
                  }`
                  $dim.style.transition = '0s'
                }
                if ($frame) {
                  $frame.style.overflowY = 'hidden'
                  $frame.style.transform = `translateX(${computedEdgeX}px)`
                  $frame.style.transition = '0s'
                }
                $frameOffsetSet.forEach(($frameOffset) => {
                  if ($frameOffset !== frameOffsetRef.current) {
                    $frameOffset.style.transform = `translateX(-${
                      5 - (5 * computedEdgeX) / window.screen.width
                    }rem)`
                    $frameOffset.style.transition = '0s'
                  }
                })
              }
            }

            requestAnimationFrameLock.current = false
          })
        }
      }
    },
    [screenEdge]
  )

  const onEdgeTouchEnd = useCallback(() => {
    if (x.current) {
      const velocity =
        x.current / (Date.now() - (screenEdge.startTime as number))

      if (velocity > 1 || x.current / window.screen.width > 0.4) {
        setPopped(true)
        navigator.pop()
      }

      setScreenEdge({
        screenEdge: {
          startX: null,
          startTime: null,
        },
      })

      x.current = 0

      requestAnimationFrame(() => {
        const $dim = dimRef.current
        const $frame = frameRef.current

        if ($dim) {
          $dim.style.opacity = ''
          $dim.style.transition = `opacity ${navigatorOptions.animationDuration}ms`
        }
        if ($frame) {
          $frame.style.overflowY = ''
          $frame.style.transform = ''
          $frame.style.transition = cupertino
            ? `transform ${navigatorOptions.animationDuration}ms`
            : ''
        }
        $frameOffsetSet.forEach(($frameOffset) => {
          $frameOffset.style.transform = ''
          $frameOffset.style.transition = `transform ${navigatorOptions.animationDuration}ms`
        })
      })
    }
  }, [screenEdge])

  const onTopClick = useCallback(() => {
    const screenInstanceOption =
      store.getState().screenInstanceOptions[props.screenInstanceId]

    if (!screenInstanceOption?.navbar.disableScrollToTop && frameRef.current) {
      const scroller = zenscroll.createScroller(frameRef.current)
      scroller.toY(0)
    }

    screenInstanceOption?.navbar.onTopClick?.()
  }, [])

  const isNavbarVisible =
    screenInstanceOptions[props.screenInstanceId]?.navbar.visible ?? false

  const cupertinoAndIsPresent = cupertino && props.isPresent
  const cupertinoAndIsNavbarVisible = cupertino && isNavbarVisible
  const androidAndIsRoot = android && props.isRoot
  const androidAndIsNavbarVisible = android && isNavbarVisible

  return (
    <div ref={props.nodeRef} className={cardTransitionNode}>
      {!props.isRoot && (
        <div
          ref={dimRef}
          className={cardDim({
            cupertinoAndIsNavbarVisible,
            cupertinoAndIsPresent,
            android,
          })}
          style={{
            transition: `opacity ${navigatorOptions.animationDuration}ms`,
          }}
        />
      )}
      <div
        className={cardMainOffset({
          androidAndIsNotTop: android && !props.isTop,
        })}
        style={{
          transition: `transform ${navigatorOptions.animationDuration}ms`,
        }}
      >
        <div
          className={cardMain({
            android,
            androidAndIsNavbarVisible,
            androidAndIsRoot,
            cupertinoAndIsNavbarVisible,
            cupertinoAndIsPresent,
          })}
          style={{
            transition:
              cupertino && props.isPresent
                ? `transform ${navigatorOptions.animationDuration}ms`
                : android
                ? `transform ${navigatorOptions.animationDuration}ms, opacity ${navigatorOptions.animationDuration}ms`
                : undefined,
          }}
        >
          {isNavbarVisible && (
            <Navbar
              screenInstanceId={props.screenInstanceId}
              theme={navigatorOptions.theme}
              isRoot={props.isRoot}
              isPresent={props.isPresent}
              onClose={props.onClose}
              onTopClick={onTopClick}
            />
          )}
          <div
            ref={frameOffsetRef}
            className={cardFrameOffset({
              cupertinoAndIsNotPresent: cupertino && !props.isPresent,
              cupertinoAndIsNotTop: cupertino && !props.isTop,
            })}
            style={{
              transition: `transform ${navigatorOptions.animationDuration}ms`,
            }}
          >
            <div
              ref={frameRef}
              className={cardFrame({
                cupertino,
                cupertinoAndIsNotRoot: cupertino && !props.isRoot,
                cupertinoAndIsPresent,
                cupertinoAndIsNotPresent: cupertino && !props.isPresent,
              })}
              style={{
                transition: cupertino
                  ? `transform ${navigatorOptions.animationDuration}ms`
                  : undefined,
              }}
            >
              {props.children}
            </div>
          </div>
          {cupertino && !props.isRoot && !props.isPresent && !popped && (
            <div
              className={cardEdge({
                cupertinoAndIsNavbarVisible,
                isNavbarVisible,
              })}
              onTouchStart={onEdgeTouchStart}
              onTouchMove={onEdgeTouchMove}
              onTouchEnd={onEdgeTouchEnd}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Card