import { useEffect, useState } from "react";

function detectMobile(): boolean {
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const touchDevice = navigator.maxTouchPoints > 0;

  /*
   * Use the SHORT side, not just innerWidth.
   *
   * Portrait phone:
   * 393 × 852 → short side = 393
   *
   * Same phone landscape:
   * 852 × 393 → short side = 393
   *
   * So rotation doesn't suddenly turn the cunt into "desktop".
   */
  const shortSide = Math.min(window.innerWidth, window.innerHeight);

  return coarsePointer || (touchDevice && shortSide <= 768);
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(detectMobile);

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)");

    const update = () => {
      setIsMobile(detectMobile());
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    coarsePointer.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);

      coarsePointer.removeEventListener("change", update);
    };
  }, []);

  return isMobile;
}
