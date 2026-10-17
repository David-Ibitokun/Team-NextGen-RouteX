import React, { useEffect, useRef, useState } from "react";

/**
 * Reusable RevealOnScroll animation component.
 * Uses IntersectionObserver to trigger performant GPU-accelerated entrance transitions
 * when sections and cards scroll into view.
 */
export function RevealOnScroll({
  children,
  className = "",
  direction = "up", // "up" | "down" | "left" | "right" | "fade" | "scale"
  delay = 0,
  duration = 700,
  threshold = 0.12,
  triggerOnce = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce && domRef.current) {
            observer.unobserve(domRef.current);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, triggerOnce]);

  const getHiddenTransform = () => {
    switch (direction) {
      case "up":
        return "translate-y-10 opacity-0";
      case "down":
        return "-translate-y-10 opacity-0";
      case "left":
        return "translate-x-10 opacity-0";
      case "right":
        return "-translate-x-10 opacity-0";
      case "scale":
        return "scale-95 opacity-0";
      case "fade":
      default:
        return "opacity-0";
    }
  };

  const getVisibleTransform = () => {
    switch (direction) {
      case "scale":
        return "scale-100 opacity-100";
      default:
        return "translate-x-0 translate-y-0 opacity-100";
    }
  };

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all cubic-bezier(0.16, 1, 0.3, 1) transform will-change-transform ${
        isVisible ? getVisibleTransform() : getHiddenTransform()
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default RevealOnScroll;
