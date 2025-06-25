"use client";

import { useState, useEffect } from "react";
import CurrentEvent from "./components/CurrentEvent";
import EventInput from "./components/EventInput";
import Analytics from "./components/Analytics";
import { getCurrentEvent, type SelectEvent } from "../db/actions";

export default function Home() {
  const [currentEvent, setCurrentEvent] = useState<SelectEvent | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadCurrentEvent = async () => {
      try {
        const event = await getCurrentEvent();
        setCurrentEvent(event);
      } catch (error) {
        console.error("Failed to load current event:", error);
      }
    };

    loadCurrentEvent();
  }, [refreshTrigger]);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Mobile Layout: Vertical Stack */}
      <div className="flex flex-col lg:hidden h-full">
        {/* Current Event - 10% of screen */}
        <div className="h-[10vh] min-h-[60px]">
          <CurrentEvent event={currentEvent} onEventEnd={refreshData} />
        </div>

        {/* Event Input - 40% of screen */}
        <div className="h-[40vh] min-h-[240px]">
          <EventInput onEventCreated={refreshData} />
        </div>

        {/* Analytics - Rest of screen, scrollable */}
        <div className="flex-1 overflow-hidden">
          <Analytics />
        </div>
      </div>

      {/* Desktop Layout: Left Column + Right Column */}
      <div className="hidden lg:flex w-full h-full">
        {/* Left Column: Current Event + Event Input */}
        <div className="w-1/2 flex flex-col border-r border-gray-200">
          {/* Current Event - Fixed height */}
          <div className="h-20 flex-shrink-0">
            <CurrentEvent event={currentEvent} onEventEnd={refreshData} />
          </div>

          {/* Event Input - Rest of left column */}
          <div className="flex-1 overflow-y-auto">
            <EventInput onEventCreated={refreshData} />
          </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="w-1/2 overflow-hidden">
          <Analytics />
        </div>
      </div>
    </div>
  );
}
