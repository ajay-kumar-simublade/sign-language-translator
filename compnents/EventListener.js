import React, { useState } from "react";
import { useDailyEvent } from "@daily-co/daily-react";

export function CallEvents() {
  const [meetingState, setMeetingState] = useState(
    "Hey how are you? Hey how are you? Hey how are you? Hey how are you? ",
  );
  useDailyEvent("app-message", (ev) => {
    console.log("EV", ev);
    if (ev?.data?.properties?.role === "replica")
      setMeetingState(ev?.data?.properties?.speech);
  });

  return (
    <div className="absolute bottom-4 bg-black bg-opacity-50 text-white text-center px-4 py-2 rounded-md w-1/2">
      {meetingState}
    </div>
  );
}
