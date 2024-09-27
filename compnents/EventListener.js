import React, { useState } from "react";
import { useDailyEvent } from "@daily-co/daily-react";

export function CallEvents() {
  const [meetingState, setMeetingState] = useState("loading");
  useDailyEvent("app-message", (ev) => {
    console.log("RECEIVED APP MESSAGE", ev);
    setMeetingState(ev?.data?.properties?.speech);
  });

  return (
    <div>
      <h2>Transcript</h2>
      <ul>{meetingState}</ul>
    </div>
  );
}
