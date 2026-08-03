import { useRef, useState, useCallback, useEffect } from "react";
import { Move } from "lucide-react";

/**
 * A cover-photo frame you can drag vertically to reposition, the same way
 * Facebook/LinkedIn cover photos work. `positionY` is a 0-100 percentage
 * (0 = show the top of the image, 100 = show the bottom).
 */
export default function RepositionableCover({
  imageUrl,
  positionY,
  onPositionChange,
  height = "h-40 sm:h-52",
  className = "",
}) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ startY: 0, startPosition: 50 });

  const handlePointerDown = useCallback(
    (e) => {
      if (!imageUrl) return;
      setDragging(true);
      dragState.current = {
        startY: e.clientY ?? e.touches?.[0]?.clientY ?? 0,
        startPosition: positionY,
      };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [imageUrl, positionY]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging || !containerRef.current) return;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const deltaY = clientY - dragState.current.startY;
      const containerHeight = containerRef.current.offsetHeight || 1;

      // Dragging down should reveal more of the top of the image, so the
      // focal point (position%) moves the opposite direction of the cursor.
      const deltaPercent = (deltaY / containerHeight) * 100;
      const next = Math.min(100, Math.max(0, dragState.current.startPosition - deltaPercent));
      onPositionChange(Math.round(next));
    },
    [dragging, onPositionChange]
  );

  const handlePointerUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [dragging, handlePointerMove, handlePointerUp]);

  if (!imageUrl) return null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      className={`relative w-full ${height} overflow-hidden select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
    >
      <img
        src={imageUrl}
        alt="Cover"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: `center ${positionY}%` }}
      />

      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors ${
          dragging ? "bg-black/25" : ""
        }`}
      >
        <div
          className={`flex items-center gap-1.5 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-opacity ${
            dragging ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}
        >
          <Move size={13} />
          Drag to reposition
        </div>
      </div>
    </div>
  );
}