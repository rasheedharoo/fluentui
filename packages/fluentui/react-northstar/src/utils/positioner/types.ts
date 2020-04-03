import * as PopperJs from '@popperjs/core';
import * as React from 'react';

// Temporary typings for modifiers

type ModifierProps<Name, Options> = {
  enabled?: boolean;
  name: Name;
  options?: Options;
};

export type ArrowModifier = ModifierProps<
  'arrow',
  Partial<{
    element: HTMLElement | string;
    padding: PopperJs.Padding;
  }>
>;

export type FlipModifier = ModifierProps<
  'flip',
  Partial<{
    fallbackPlacements: PopperJs.Placement[];
    padding: PopperJs.Padding;
    boundary: PopperJs.Boundary;
    rootBoundary: PopperJs.RootBoundary;
    altBoundary: boolean;
    flipVariations: boolean;
  }>
>;

export type OffsetFunctionParam = {
  popper: PopperJs.Rect;
  reference: PopperJs.Rect;
  placement: PopperJs.Placement;
};

declare type OffsetFunction = (param: OffsetFunctionParam) => [number | null | undefined, number | null | undefined];

declare type Offset = OffsetFunction | [number | null | undefined, number | null | undefined];

export type OffsetModifier = ModifierProps<
  'offset',
  Partial<{
    offset: Offset;
  }>
>;

export type PreventOverflowModifier = ModifierProps<
  'preventOverflow',
  Partial<{
    mainAxis: boolean;
    altAxis: boolean;
    boundary: PopperJs.Boundary;
    rootBoundary: PopperJs.RootBoundary;
    altBoundary: boolean;
    /**
     * Allows the popper to overflow from its boundaries to keep it near its
     * reference element
     */
    tether: boolean;
    tetherOffset: (arg0: { popper: PopperJs.Rect; reference: PopperJs.Rect; placement: PopperJs.Placement }) => number;
    padding: PopperJs.Padding;
  }>
>;

export type PopperModifiers = (ArrowModifier | FlipModifier | OffsetModifier | PreventOverflowModifier)[];

export type Position = 'above' | 'below' | 'before' | 'after';
export type Alignment = 'top' | 'bottom' | 'start' | 'end' | 'center';

export type PopperChildrenFn = (props: PopperChildrenProps) => React.ReactElement;

export interface PositioningProps {
  /**
   * Alignment for the component.
   */
  align?: Alignment;

  /** The element which will define the boundaries of the popper position for the flip behavior. */
  flipBoundary?: PopperJs.Boundary;

  /** The element which will define the boundaries of the popper position for the overflow behavior. */
  overflowBoundary?: PopperJs.Boundary;

  /**
   * Position for the component. Position has higher priority than align. If position is vertical ('above' | 'below')
   * and align is also vertical ('top' | 'bottom') or if both position and align are horizontal ('before' | 'after'
   * and 'start' | 'end' respectively), then provided value for 'align' will be ignored and 'center' will be used instead.
   */
  position?: Position;

  /**
   * Enables the Popper box to position itself in 'fixed' mode (default value is position: 'absolute')
   * @default false
   */
  positionFixed?: boolean;

  // TODO
  offset?: OffsetModifier['options']['offset'];

  /**
   * Disables automatic repositioning of the component; it will always be placed according to the values of `align` and
   * `position` props, regardless of the size of the component, the reference element or the viewport.
   */
  unstable_pinned?: boolean;
}

export interface PopperProps extends PositioningProps {
  /**
   * Ref object containing the pointer node.
   */
  pointerTargetRef?: React.RefObject<Element>;

  /**
   * The content of the Popper box (the element that is going to be repositioned).
   */
  children: PopperChildrenFn | React.ReactElement;

  /**
   * Enables events (resize, scroll).
   * @default true
   */
  enabled?: boolean;

  /**
   * List of modifiers used to modify the offsets before they are applied to the Popper box.
   * They provide most of the functionality of Popper.js.
   */
  modifiers?: PopperModifiers;

  /**
   * Array of conditions to be met in order to trigger a subsequent render to reposition the elements.
   */
  positioningDependencies?: React.DependencyList;

  /**
   * Ref object containing the target node (the element that we're using as reference for Popper box).
   */
  targetRef: React.RefObject<Element> | PopperJs.VirtualElement;

  /**
   * Rtl attribute for the component.
   */
  rtl?: boolean;
}

export interface PopperChildrenProps {
  /**
   * Popper's placement.
   */
  placement: PopperJs.Placement;

  /**
   * Function that updates the position of the Popper box, computing the new offsets and applying the new style.
   */
  scheduleUpdate(): void;
}

export type PopperShorthandProps = PositioningProps;
