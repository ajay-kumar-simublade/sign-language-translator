import React, { useState } from "react";
import { useDailyEvent } from "@daily-co/daily-react";

export function CallEvents() {
  const [meetingState, setMeetingState] = useState("Hey how are you?");
  useDailyEvent("app-message", async (ev) => {
    if (ev?.data?.properties?.role === "replica")
      setMeetingState(ev?.data?.properties?.speech);
  });

  return (
    <div className="absolute w-full py-4">
      <strong>Nyla: {' '}</strong>
      {meetingState}
    </div>
  );
}
