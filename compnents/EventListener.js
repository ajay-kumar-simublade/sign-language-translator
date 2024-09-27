import React, { useState } from "react";
import { useDailyEvent } from "@daily-co/daily-react";

export function CallEvents() {
  const [meetingState, setMeetingState] = useState("Hey how are you?");
  useDailyEvent("app-message", (ev) => {
    console.log("EV", ev);
    if (ev?.data?.properties?.role === "replica")
      setMeetingState(ev?.data?.properties?.speech);
  });

  return (
    <div className="absolute  bg-gray-950 px-4  w-full py-4">
      <strong>Transcript: {' '}</strong>
      {meetingState}
    </div>
  );
}
