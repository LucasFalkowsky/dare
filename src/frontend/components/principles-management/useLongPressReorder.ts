import { useCallback, useEffect, useRef, useState } from "react";

/** How long the pointer has to stay down before the row starts travelling. */
export const LONG_PRESS_MS = 180;
/** Travel allowed during the hold — more than this reads as a scroll. */
const HOLD_TOLERANCE_PX = 8;
/**
 * Elements that own their own pointer gestures. A press that starts here is
 * neither a drag nor a row click: buttons act, text fields take a caret.
 */
const INTERACTIVE = "button, a, input, textarea, select, [data-no-row-gesture]";

/** True when the event target is plain row surface, not a control inside it. */
export function isRowGesture(target: EventTarget | null): boolean {
  return target instanceof Element ? !target.closest(INTERACTIVE) : true;
}

export interface RowReorderProps {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClickCapture: (e: React.MouseEvent) => void;
}

interface Options {
  /** Lift the row out of `from` and insert it at `to`. */
  onMove: (from: number, to: number) => void;
  /** Rows available as drop targets — keyboard moves stay inside the list. */
  count: number;
  longPressMs?: number;
}

/**
 * Press-and-hold reordering for a vertical list: the whole row is the handle.
 *
 * A short press falls through as a normal click (the row expands); holding for
 * `longPressMs` picks the row up, the row under the pointer becomes the drop
 * target, and releasing commits the move. The click that ends a hold is
 * swallowed so a drag never toggles the row open. `Alt` + `ArrowUp`/`ArrowDown`
 * does the same move from the keyboard.
 */
export function useLongPressReorder({ onMove, count, longPressMs = LONG_PRESS_MS }: Options) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  /** How far the held row has travelled from where it was picked up, in px. */
  const [dragOffset, setDragOffset] = useState(0);

  // The window handlers below are registered once, so everything they read
  // lives in refs rather than in the closure.
  const dragIndexRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const pressRef = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const originYRef = useRef(0);
  const swallowClickRef = useRef(false);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const cancelPress = useCallback(() => {
    if (pressRef.current) clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancelPress();
    dragIndexRef.current = null;
    overIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
    setDragOffset(0);
  }, [cancelPress]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (dragIndexRef.current !== null) {
        setDragOffset(e.clientY - originYRef.current);
        return;
      }
      const press = pressRef.current;
      if (!press) return;
      if (
        Math.abs(e.clientX - press.x) > HOLD_TOLERANCE_PX ||
        Math.abs(e.clientY - press.y) > HOLD_TOLERANCE_PX
      ) {
        cancelPress();
      }
    };

    const handleUp = () => {
      const from = dragIndexRef.current;
      const to = overIndexRef.current;
      if (from !== null) {
        // The hold already consumed this gesture — keep the trailing click
        // from expanding the row it just dropped.
        swallowClickRef.current = true;
        if (to !== null && to !== from) onMoveRef.current(from, to);
      }
      reset();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [cancelPress, reset]);

  useEffect(() => cancelPress, [cancelPress]);

  const getRowProps = useCallback(
    (index: number): RowReorderProps => ({
      onPointerDown: (e) => {
        if (e.button !== 0 || !isRowGesture(e.target)) return;
        swallowClickRef.current = false;
        cancelPress();
        const { clientX: x, clientY: y } = e;
        pressRef.current = {
          x,
          y,
          timer: setTimeout(() => {
            pressRef.current = null;
            originYRef.current = y;
            dragIndexRef.current = index;
            overIndexRef.current = index;
            setDragIndex(index);
            setOverIndex(index);
          }, longPressMs),
        };
      },
      onPointerMove: () => {
        if (dragIndexRef.current === null || overIndexRef.current === index) return;
        overIndexRef.current = index;
        setOverIndex(index);
      },
      onKeyDown: (e) => {
        if (!e.altKey || !isRowGesture(e.target)) return;
        const direction = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
        if (direction === 0) return;
        const target = index + direction;
        if (target < 0 || target >= count) return;
        e.preventDefault();
        onMoveRef.current(index, target);
      },
      onClickCapture: (e) => {
        if (!swallowClickRef.current) return;
        swallowClickRef.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
    }),
    [cancelPress, count, longPressMs],
  );

  /** Which edge of row `index` the held row would land on. */
  const dropEdgeFor = useCallback(
    (index: number): "top" | "bottom" | undefined => {
      if (dragIndex === null || overIndex !== index || dragIndex === index) return undefined;
      return dragIndex < index ? "bottom" : "top";
    },
    [dragIndex, overIndex],
  );

  return { dragIndex, dragOffset, getRowProps, dropEdgeFor };
}
