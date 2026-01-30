import { useState, useCallback, useRef, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface UseDraggableOptions {
  initialPosition?: Position;
  onPositionChange?: (pos: Position) => void;
  elementWidth?: number;
  elementHeight?: number;
  padding?: number;
  snapToCorners?: boolean;
  defaultCorner?: Corner;
}

interface UseDraggableReturn {
  position: Position;
  isDragging: boolean;
  currentCorner: Corner;
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
  containerStyle: React.CSSProperties;
  setPosition: (pos: Position) => void;
  snapToCorner: (corner: Corner) => void;
}

// Get reliable viewport dimensions
function getViewportSize(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1920, height: 1080 };
  }

  // Use visualViewport if available (more accurate on mobile and with dev tools)
  if (window.visualViewport) {
    return {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
    };
  }

  // Fallback to clientWidth/clientHeight which excludes scrollbars
  return {
    width: document.documentElement.clientWidth || window.innerWidth,
    height: document.documentElement.clientHeight || window.innerHeight,
  };
}

export function useDraggable(
  options: UseDraggableOptions = {}
): UseDraggableReturn {
  const {
    initialPosition,
    onPositionChange,
    elementWidth = 320,
    elementHeight = 400,
    padding = 16,
    snapToCorners = true,
    defaultCorner = "bottom-right",
  } = options;

  // Calculate corner positions
  const getCornerPositions = useCallback(() => {
    const viewport = getViewportSize();

    const maxX = Math.max(padding, viewport.width - elementWidth - padding);
    const maxY = Math.max(padding, viewport.height - elementHeight - padding);

    return {
      "top-left": { x: padding, y: padding },
      "top-right": { x: maxX, y: padding },
      "bottom-left": { x: padding, y: maxY },
      "bottom-right": { x: maxX, y: maxY },
    };
  }, [elementWidth, elementHeight, padding]);

  // Get default position based on corner
  const getDefaultPosition = useCallback((): Position => {
    const corners = getCornerPositions();
    return corners[defaultCorner];
  }, [getCornerPositions, defaultCorner]);

  // Find nearest corner to a position
  const findNearestCorner = useCallback(
    (pos: Position): Corner => {
      const corners = getCornerPositions();
      let nearestCorner: Corner = defaultCorner;
      let minDistance = Infinity;

      (Object.entries(corners) as [Corner, Position][]).forEach(
        ([corner, cornerPos]) => {
          const distance = Math.sqrt(
            Math.pow(pos.x - cornerPos.x, 2) + Math.pow(pos.y - cornerPos.y, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCorner = corner;
          }
        }
      );

      return nearestCorner;
    },
    [getCornerPositions, defaultCorner]
  );

  const [position, setPositionState] = useState<Position>(
    initialPosition || { x: -1, y: -1 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentCorner, setCurrentCorner] = useState<Corner>(defaultCorner);

  // Refs for drag state
  const positionRef = useRef(position);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementStartRef = useRef<Position>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // Keep position ref in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Initialize position on mount
  useEffect(() => {
    if (position.x === -1 && position.y === -1) {
      const defaultPos = getDefaultPosition();
      setPositionState(defaultPos);
      positionRef.current = defaultPos;
      onPositionChange?.(defaultPos);
    }
  }, [position.x, position.y, getDefaultPosition, onPositionChange]);

  // Handle window resize and element size changes - snap to current corner
  useEffect(() => {
    const handleResize = () => {
      if (isDraggingRef.current) return;

      const corners = getCornerPositions();
      const newPos = corners[currentCorner];
      setPositionState(newPos);
      positionRef.current = newPos;
      onPositionChange?.(newPos);
    };

    window.addEventListener("resize", handleResize);

    // Also listen to visualViewport resize if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, [currentCorner, getCornerPositions, onPositionChange]);

  // Re-snap when element dimensions change
  useEffect(() => {
    if (isDraggingRef.current || position.x === -1) return;

    const corners = getCornerPositions();
    const newPos = corners[currentCorner];

    // Only update if position actually changed
    if (newPos.x !== position.x || newPos.y !== position.y) {
      setIsAnimating(true);
      setPositionState(newPos);
      positionRef.current = newPos;
      onPositionChange?.(newPos);

      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [elementWidth, elementHeight, currentCorner, getCornerPositions, onPositionChange, position.x, position.y]);

  // Calculate bounded position during drag
  const getBoundedPosition = useCallback(
    (x: number, y: number): Position => {
      const viewport = getViewportSize();

      const maxX = Math.max(padding, viewport.width - elementWidth - padding);
      const maxY = Math.max(padding, viewport.height - elementHeight - padding);

      return {
        x: Math.max(padding, Math.min(x, maxX)),
        y: Math.max(padding, Math.min(y, maxY)),
      };
    },
    [elementWidth, elementHeight, padding]
  );

  // Snap to a specific corner with animation
  const snapToCorner = useCallback(
    (corner: Corner) => {
      const corners = getCornerPositions();
      const targetPos = corners[corner];

      setIsAnimating(true);
      setCurrentCorner(corner);
      setPositionState(targetPos);
      positionRef.current = targetPos;
      onPositionChange?.(targetPos);

      // Remove animation flag after transition
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    },
    [getCornerPositions, onPositionChange]
  );

  // Set position (for external use)
  const setPosition = useCallback(
    (pos: Position) => {
      const bounded = getBoundedPosition(pos.x, pos.y);
      setPositionState(bounded);
      positionRef.current = bounded;

      // Update current corner based on position
      if (snapToCorners) {
        setCurrentCorner(findNearestCorner(bounded));
      }
    },
    [getBoundedPosition, snapToCorners, findNearestCorner]
  );

  // Update position during drag
  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStartRef.current) return;

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      const newX = elementStartRef.current.x + deltaX;
      const newY = elementStartRef.current.y + deltaY;

      const bounded = getBoundedPosition(newX, newY);
      positionRef.current = bounded;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setPositionState(bounded);
      });
    },
    [getBoundedPosition]
  );

  // Handle drag end - snap to nearest corner
  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    dragStartRef.current = null;
    setIsDragging(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Snap to nearest corner
    if (snapToCorners) {
      const nearestCorner = findNearestCorner(positionRef.current);
      snapToCorner(nearestCorner);
    } else {
      onPositionChange?.(positionRef.current);
    }
  }, [snapToCorners, findNearestCorner, snapToCorner, onPositionChange]);

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [updatePosition, handleDragEnd]);

  // Touch handlers
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      e.preventDefault();
      updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
      handleDragEnd();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [updatePosition, handleDragEnd]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Mouse down handler
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementStartRef.current = { ...positionRef.current };
    setIsDragging(true);
    setIsAnimating(false);
  }, []);

  // Touch start handler
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!e.touches[0]) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    elementStartRef.current = { ...positionRef.current };
    setIsDragging(true);
    setIsAnimating(false);
  }, []);

  // Container style using transform for better performance
  const containerStyle: React.CSSProperties =
    position.x !== -1 && position.y !== -1
      ? {
          position: "fixed" as const,
          left: 0,
          top: 0,
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          willChange: isDragging ? "transform" : "auto",
          transition:
            isAnimating && !isDragging
              ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
          zIndex: 9999,
        }
      : {
          position: "fixed" as const,
          right: `${padding}px`,
          bottom: `${padding}px`,
          zIndex: 9999,
        };

  return {
    position,
    isDragging,
    currentCorner,
    dragHandleProps: {
      onMouseDown,
      onTouchStart,
      style: {
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none" as const,
        touchAction: "none" as const,
      },
    },
    containerStyle,
    setPosition,
    snapToCorner,
  };
}
