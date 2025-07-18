import {toString as pathToString} from '@sanity/util/paths'
import {omit} from 'lodash'
import {type ReactNode, useCallback, useMemo} from 'react'
import {PaneRouterContext} from 'sanity/_singletons'
import {useRouter, useRouterState} from 'sanity/router'

import {type RouterPaneGroup, type RouterPanes, type RouterPaneSibling} from '../../types'
import {usePaneLayout} from '../pane/usePaneLayout'
import {BackLink} from './BackLink'
import {ChildLink} from './ChildLink'
import {ParameterizedLink} from './ParameterizedLink'
import {ReferenceChildLink} from './ReferenceChildLink'
import {type PaneRouterContextValue} from './types'

const emptyArray: never[] = []

/**
 * @internal
 */
export function PaneRouterProvider(props: {
  children: ReactNode
  flatIndex: number
  index: number
  params: Record<string, string | undefined>
  payload: unknown
  siblingIndex: number
}) {
  const {children, flatIndex, index, params, payload, siblingIndex} = props
  const {navigate, navigateIntent, resolvePathFromState} = useRouter()
  const routerState = useRouterState()
  const {panes, expand} = usePaneLayout()
  const routerPaneGroups: RouterPaneGroup[] = useMemo(
    () => (routerState?.panes || emptyArray) as RouterPanes,
    [routerState?.panes],
  )
  const lastPane = useMemo(() => panes?.[panes.length - 2], [panes])

  const groupIndex = index - 1

  const createNextRouterState = useCallback(
    (modifier: (siblings: RouterPaneGroup, item: RouterPaneSibling) => RouterPaneGroup) => {
      const currentGroup = routerPaneGroups[groupIndex] || []
      const currentItem = currentGroup[siblingIndex]
      const nextGroup = modifier(currentGroup, currentItem)
      const nextPanes = [
        ...routerPaneGroups.slice(0, groupIndex),
        nextGroup,
        ...routerPaneGroups.slice(groupIndex + 1),
      ]
      const nextRouterState = {...routerState, panes: nextPanes}

      return nextRouterState
    },
    [groupIndex, routerPaneGroups, routerState, siblingIndex],
  )

  const modifyCurrentGroup = useCallback(
    (modifier: (siblings: RouterPaneGroup, item: RouterPaneSibling) => RouterPaneGroup) => {
      const nextRouterState = createNextRouterState(modifier)
      setTimeout(() => navigate(nextRouterState), 0)
      return nextRouterState
    },
    [createNextRouterState, navigate],
  )

  const createPathWithParams: PaneRouterContextValue['createPathWithParams'] = useCallback(
    (nextParams) => {
      const nextRouterState = createNextRouterState((siblings, item) => [
        ...siblings.slice(0, siblingIndex),
        {...item, params: nextParams},
        ...siblings.slice(siblingIndex + 1),
      ])

      return resolvePathFromState(nextRouterState)
    },
    [createNextRouterState, resolvePathFromState, siblingIndex],
  )

  const setPayload: PaneRouterContextValue['setPayload'] = useCallback(
    (nextPayload) => {
      modifyCurrentGroup((siblings, item) => [
        ...siblings.slice(0, siblingIndex),
        {...item, payload: nextPayload},
        ...siblings.slice(siblingIndex + 1),
      ])
    },
    [modifyCurrentGroup, siblingIndex],
  )

  const setParams: PaneRouterContextValue['setParams'] = useCallback(
    (nextParams) => {
      modifyCurrentGroup((siblings, item) => [
        ...siblings.slice(0, siblingIndex),
        {...item, params: nextParams},
        ...siblings.slice(siblingIndex + 1),
      ])
    },
    [modifyCurrentGroup, siblingIndex],
  )

  const handleEditReference: PaneRouterContextValue['handleEditReference'] = useCallback(
    ({id, parentRefPath, type, template, version}) => {
      navigate({
        panes: [
          ...routerPaneGroups.slice(0, groupIndex + 1),
          [
            {
              id,
              params: {
                template: template.id,
                parentRefPath: pathToString(parentRefPath),
                type,
                version,
              },
              payload: template.params,
            },
          ],
        ],
      })
    },
    [groupIndex, navigate, routerPaneGroups],
  )

  const ctx: PaneRouterContextValue = useMemo(
    () => ({
      // Zero-based index (position) of pane, visually
      index: flatIndex,

      // Zero-based index of pane group (within URL structure)
      groupIndex,

      // Zero-based index of pane within sibling group
      siblingIndex,

      // Payload of the current pane
      payload,

      // Params of the current pane
      params,

      // Whether or not the pane has any siblings (within the same group)
      hasGroupSiblings: routerPaneGroups[groupIndex]
        ? routerPaneGroups[groupIndex].length > 1
        : false,

      // The length of the current group
      groupLength: routerPaneGroups[groupIndex] ? routerPaneGroups[groupIndex].length : 0,

      // Current router state for the "panes" property
      routerPanesState: routerPaneGroups,

      // Curried StateLink that passes the correct state automatically
      ChildLink,

      // Curried StateLink that pops off the last pane group
      // Only pass if this is not the first pane
      BackLink: flatIndex ? BackLink : undefined,

      // A specialized `ChildLink` that takes in the needed props to open a
      // referenced document to the right
      ReferenceChildLink,

      // Similar to `ReferenceChildLink` expect without the wrapping component
      handleEditReference,

      // Curried StateLink that passed the correct state, but merges params/payload
      ParameterizedLink,

      // Replaces the current pane with a new one
      replaceCurrent: (opts = {}): void => {
        modifyCurrentGroup(() => [
          {id: opts.id || '', payload: opts.payload, params: opts.params || {}},
        ])
      },

      // Removes the current pane from the group
      closeCurrent: (): void => {
        modifyCurrentGroup((siblings, item) =>
          siblings.length > 1 ? siblings.filter((sibling) => sibling !== item) : siblings,
        )
      },

      // Removes all panes to the right including current
      closeCurrentAndAfter: (expandLast = true): void => {
        if (expandLast && lastPane) {
          expand(lastPane.element)
        }
        navigate({
          panes: routerPaneGroups.slice(0, groupIndex),
        })
      },

      // Duplicate the current pane, with optional overrides for payload, parameters
      duplicateCurrent: (options): void => {
        modifyCurrentGroup((siblings, item) => {
          const duplicatedItem = {
            ...item,
            payload: options?.payload || item.payload,
            params: options?.params || item.params,
          }

          return [
            ...siblings.slice(0, siblingIndex),
            duplicatedItem,
            ...siblings.slice(siblingIndex),
          ]
        })
      },

      // Set the view for the current pane
      setView: (viewId) => {
        const restParams = omit(params, 'view')
        return setParams(viewId ? {...restParams, view: viewId} : restParams)
      },

      // Set the parameters for the current pane
      setParams,

      // Set the payload for the current pane
      setPayload,

      // A function that returns a path with the given parameters
      createPathWithParams,

      // Proxied navigation to a given intent. Consider just exposing `router` instead?
      navigateIntent,
    }),
    [
      flatIndex,
      groupIndex,
      siblingIndex,
      payload,
      params,
      routerPaneGroups,
      handleEditReference,
      setParams,
      setPayload,
      createPathWithParams,
      navigateIntent,
      modifyCurrentGroup,
      lastPane,
      navigate,
      expand,
    ],
  )

  return <PaneRouterContext.Provider value={ctx}>{children}</PaneRouterContext.Provider>
}
