/* eslint-disable camelcase */

import {Card, rem} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {ScrollContainer} from '../../../components/scroll'
import {createListName, TEXT_LEVELS} from './text'

export const Root = styled(Card)<{$isOneLine: boolean}>`
  &[data-fullscreen='true'] {
    height: 100%;
  }

  &[data-fullscreen='false'] {
    min-height: 5em;
    resize: ${({$isOneLine}) => ($isOneLine ? 'none' : 'vertical')};
    overflow: auto;
    height: ${({$isOneLine}) => ($isOneLine ? 'auto' : '19em')};
  }

  &:not([hidden]) {
    display: flex;
  }

  flex-direction: column;
`

export const ToolbarCard = styled(Card)`
  z-index: 10;
  line-height: 0;
`

export const EditableCard = styled(Card)`
  position: relative;
  overflow: hidden;
  overflow: clip;

  & > [data-portal] {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    & > * {
      pointer-events: initial;
    }
  }

  &::selection,
  *::selection {
    background-color: transparent;
  }
`

export const Scroller = styled(ScrollContainer)`
  position: relative;
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;

  & > * {
    flex: 1;
    min-height: auto;
  }
`

export const EditableWrapper = styled(Card)<{$isFullscreen: boolean; $isOneLine: boolean}>`
  height: 100%;
  width: 100%;
  counter-reset: ${TEXT_LEVELS.map((l) => createListName(l)).join(' ')};
  overflow: hidden;
  overflow: clip;

  & > div {
    height: 100%;
  }

  & .pt-editable {
    display: block;
    width: 100%;
    height: 100%;

    ${TEXT_LEVELS.map((l) => {
      return css`
        /* Reset the list count each time a list index of 1 is encountered
         * for the current level.
         */
        & [data-level='${l}'][data-list-index='1'] {
          counter-set: ${createListName(l)} 1;
        }
        /* Otherwise, increment the list count for the current level. */
        & [data-level='${l}']:not([data-list-index='1']) {
          counter-increment: ${createListName(l)};
        }
      `
    })}

    & > .pt-list-item-bullet + .pt-list-item-number,
    & > .pt-list-item-number + .pt-list-item-bullet {
      margin-top: ${({theme}) => theme.sanity.space[3]}px;
    }

    & > :not(.pt-list-item) + .pt-list-item {
      margin-top: ${({theme}) => theme.sanity.space[2]}px;
    }

    & > .pt-list-item + :not(.pt-list-item) {
      margin-top: ${({theme}) => theme.sanity.space[3]}px;
    }

    & > :first-child {
      padding-top: ${({$isFullscreen, theme}) => theme.sanity.space[$isFullscreen ? 5 : 3]}px;
    }

    padding-bottom: ${({$isFullscreen, $isOneLine, theme}) =>
      $isOneLine ? '0' : theme.sanity.space[$isFullscreen ? 9 : 5]}px;

    & > .pt-block {
      margin: 0 auto;
      max-width: ${(props) => getTheme_v2(props.theme).container[1]}px;
    }

    /* & > .pt-block {
      & .pt-inline-object {
      }
    } */

    & .pt-drop-indicator {
      pointer-events: none;
      border: 1px solid var(--card-focus-ring-color) !important;
      height: 0px !important;
      border-radius: ${(props) => getTheme_v2(props.theme).radius[2]}px;
      margin-top: -3px;
      left: calc(
        ${({$isFullscreen, theme}) =>
            $isFullscreen ? rem(theme.sanity.space[5]) : rem(theme.sanity.space[3])} -
          1px
      );
      right: calc(
        ${({$isFullscreen, theme}) =>
            $isFullscreen ? rem(theme.sanity.space[5]) : rem(theme.sanity.space[3])} -
          1px
      );
      width: calc(
        100% -
          ${({$isFullscreen, theme}) =>
            $isFullscreen ? rem(theme.sanity.space[5] * 2) : rem(theme.sanity.space[3] * 2)} +
          2px
      ) !important;
    }
  }
`
