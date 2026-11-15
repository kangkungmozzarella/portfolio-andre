"use client";

import { useEffect, useState } from "react";

// The local time where Andrea works, so a visitor knows whether it is a good hour to write.
export function Clock({ place, timezone }: { place: string; timezone: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false });
    const update = () => setTime(format.format(new Date()));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [timezone]);

  return (
    <p className="clock">
      <span className="clock-place">{place}</span>
      <span className="local-time">{time}</span>
    </p>
  );
}
