import { useEffect } from "react";

export default function useDisablePinchZoom() {
  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    let originalContent = "";

    if (viewportMeta) {
      originalContent = viewportMeta.getAttribute("content") || "";
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content =
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.head.appendChild(meta);
    }

    const preventPinch = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventGesture = (e) => e.preventDefault();

    document.addEventListener("touchmove", preventPinch, { passive: false });
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);

    return () => {
      if (viewportMeta) {
        viewportMeta.setAttribute("content", originalContent);
      } else {
        const createdMeta = document.querySelector('meta[name="viewport"]');
        if (createdMeta) createdMeta.remove();
      }
      document.removeEventListener("touchmove", preventPinch);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
    };
  }, []);
}
