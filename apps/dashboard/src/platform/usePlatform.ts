import { useEffect, useState } from "react";
import { BUILD_TARGET, detectFormFactor, SSR_FORM_FACTOR, type FormFactor } from "./platform";

/** Hydration-safe form factor hook (server renders the SSR default). */
export function usePlatform() {
  const [formFactor, setFormFactor] = useState<FormFactor>(SSR_FORM_FACTOR);

  useEffect(() => {
    const update = () => setFormFactor(detectFormFactor(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { target: BUILD_TARGET, formFactor };
}
