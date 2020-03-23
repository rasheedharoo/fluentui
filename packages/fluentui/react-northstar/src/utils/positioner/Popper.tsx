import { useIsomorphicLayoutEffect } from '@fluentui/react-bindings';
import { Ref, isRefObject } from '@fluentui/react-component-ref';
import * as PopperJs from '@popperjs/core';
import * as _ from 'lodash';
import * as React from 'react';

import isBrowser from '../isBrowser';
import getScrollParent from './getScrollParent';
import { getPlacement } from './positioningHelper';
import { PopperModifiers, PopperProps } from './types';

/**
 * Memoize a result using deep equality. This hook has two advantages over
 * React.useMemo: it uses deep equality to compare memo keys, and it guarantees
 * that the memo function will only be called if the keys are unequal.
 * React.useMemo cannot be relied on to do this, since it is only a performance
 * optimization (see https://reactjs.org/docs/hooks-reference.html#usememo).
 *
 * Copied from https://github.com/apollographql/react-apollo/blob/master/packages/hooks/src/utils/useDeepMemo.ts.
 */
function useDeepMemo<TKey, TValue>(memoFn: () => TValue, key: TKey): TValue {
  const ref = React.useRef<{ key: TKey; value: TValue }>();

  if (!ref.current || !_.isEqual(key, ref.current.key)) {
    ref.current = { key, value: memoFn() };
  }

  return ref.current.value;
}

/**
 * Popper relies on the 3rd party library [Popper.js](https://github.com/FezVrasta/popper.js) for positioning.
 */
const Popper: React.FunctionComponent<PopperProps> = props => {
  const {
    align,
    children,
    enabled,
    flipBoundary,
    modifiers: userModifiers,
    offset,
    overflowBoundary,
    pointerTargetRef,
    position,
    positionFixed,
    positioningDependencies = [],
    rtl,
    targetRef,
    unstable_pinned,
  } = props;

  const proposedPlacement = getPlacement({ align, position, rtl });

  const popperRef = React.useRef<PopperJs.Instance>();
  const contentRef = React.useRef<HTMLElement>(null);

  const latestPlacement = React.useRef<PopperJs.Placement>(proposedPlacement);
  const [computedPlacement, setComputedPlacement] = React.useState<PopperJs.Placement>(proposedPlacement);

  const hasDocument = isBrowser();
  const hasScrollableElement = React.useMemo(() => {
    if (hasDocument) {
      const scrollParentElement = getScrollParent(contentRef.current);

      return scrollParentElement !== scrollParentElement.ownerDocument.body;
    }

    return false;
  }, [contentRef, hasDocument]);
  // Is a broken dependency and can cause potential bugs, we should rethink this as all other refs
  // in this component.

  const computedModifiers = useDeepMemo<any, PopperModifiers>(
    () => [
      { name: 'flip', options: { flipVariations: true } },

      offset && {
        name: 'offset',
        options: { offset: rtl ? offset /* TODO */ : offset },
      },

      flipBoundary && { name: 'flip', options: { boundary: flipBoundary } },
      overflowBoundary && { name: 'preventOverflow', options: { boundary: overflowBoundary } },

      /**
       * unstable_pinned disables the flip modifier by setting flip.enabled to false; this
       * disables automatic repositioning of the popper box; it will always be placed according to
       * the values of `align` and `position` props, regardless of the size of the component, the
       * reference element or the viewport.
       */
      unstable_pinned && { name: 'flip', enabled: false },

      /**
       * When the popper box is placed in the context of a scrollable element, we need to set
       * preventOverflow.escapeWithReference to true and flip.boundariesElement to 'scrollParent'
       * (default is 'viewport') so that the popper box will stick with the targetRef when we
       * scroll targetRef out of the viewport.
       */
      hasScrollableElement && { name: 'flip', options: { boundary: 'clippingParents' } },

      ...userModifiers,
    ],
    [flipBoundary, hasScrollableElement, offset, overflowBoundary, userModifiers],
  );

  const createInstance = React.useCallback(() => {
    const reference: Element | PopperJs.VirtualElement =
      targetRef && isRefObject(targetRef)
        ? (targetRef as React.RefObject<Element>).current
        : (targetRef as PopperJs.VirtualElement);

    if (!enabled || !reference || !contentRef.current) {
      return;
    }

    const handleUpdate = ({ state }: { state: Partial<PopperJs.State> }) => {
      // PopperJS performs computations that might update the computed placement: auto positioning, flipping the
      // placement in case the popper box should be rendered at the edge of the viewport and does not fit
      if (state.placement !== latestPlacement.current) {
        latestPlacement.current = state.placement;
        setComputedPlacement(state.placement);
      }
    };

    const hasPointer = !!(pointerTargetRef && pointerTargetRef.current);

    const options: PopperJs.Options = {
      placement: proposedPlacement,
      strategy: positionFixed ? 'fixed' : 'absolute',
      modifiers: [
        ...(computedModifiers as PopperJs.Options['modifiers']),

        /**
         * This modifier is necessary in order to render the pointer. Refs are resolved in effects, so it can't be
         * placed under computed modifiers. Deep merge is not required as this modifier has only these properties.
         */
        {
          name: 'arrow',
          enabled: hasPointer,
          options: {
            element: pointerTargetRef && pointerTargetRef.current,
          },
        },

        {
          name: 'onUpdate',
          enabled: true,
          phase: 'afterWrite' as PopperJs.ModifierPhases,
          fn: handleUpdate,
        },
      ].filter(Boolean),
      onFirstUpdate: state => handleUpdate({ state }),
    };

    popperRef.current = PopperJs.createPopper(reference, contentRef.current, options);
  }, [computedModifiers, contentRef, enabled, pointerTargetRef, positionFixed, proposedPlacement, targetRef]);

  const destroyInstance = React.useCallback(() => {
    if (popperRef.current) {
      popperRef.current.destroy();
      popperRef.current = null;
    }
  }, []);

  const scheduleUpdate = React.useCallback(() => {
    if (popperRef.current) {
      popperRef.current.update();
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    createInstance();
    return destroyInstance;
  }, [createInstance]);

  React.useEffect(scheduleUpdate, [...positioningDependencies, computedPlacement]);

  const child =
    typeof children === 'function'
      ? children({ placement: computedPlacement, scheduleUpdate })
      : (children as React.ReactElement);

  return child ? <Ref innerRef={contentRef}>{React.Children.only(child)}</Ref> : null;
};

Popper.defaultProps = {
  enabled: true,
  modifiers: [],
  positionFixed: false,
  positioningDependencies: [],
};

export default Popper;
