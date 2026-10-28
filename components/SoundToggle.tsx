"use client";

import { useEffect, useSyncExternalStore } from "react";
import { soundStore, sounds } from "@/lib/sound";
import { Icon } from "./Icon";

// Turns the interface sounds on and off. While on, every press of a link or button pops.
export function SoundToggle() {
  const on = useSyncExternalStore(soundStore.subscribe, soundStore.get, soundStore.getServer);

  useEffect(() => {
    if (!on) return;
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element).closest("a, button, summary")) sounds.pop();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [on]);

  return (
    <button
      className="sound-toggle"
      type="button"
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on ? "Sound on" : "Sound off"}
      onClick={() => {
        soundStore.set(!on);
        // Turning sound on answers with a pop, so the visitor hears what they enabled.
        if (!on) sounds.pop();
      }}
    >
      <Icon name={on ? "sound" : "muted"} />
    </button>
  );
}
