"use client";

import { useState, useEffect } from "react";
import { endEvent, type SelectEvent } from "../../db/actions";

interface CurrentEventProps {
  event: SelectEvent | null;
  onEventEnd: () => void;
}

export default function CurrentEvent({ event, onEventEnd }: CurrentEventProps) {
  const [duration, setDuration] = useState<string>("00:00:00");
  const [startTimeDisplay, setStartTimeDisplay] = useState<string>("");

  useEffect(() => {
    if (!event) {
      setDuration("00:00:00");
      setStartTimeDisplay("");
      return;
    }

    const startTime = new Date(event.startTime);
    const formattedStartTime = startTime.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setStartTimeDisplay(formattedStartTime);

    const updateDuration = () => {
      const start = new Date(event.startTime);
      const now = new Date();
      const diff = now.getTime() - start.getTime();

      if (diff < 0) {
        setDuration("00:00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setDuration(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [event]);

  const handleEndEvent = async () => {
    if (!event) return;

    try {
      await endEvent(event.id, new Date());
      onEventEnd();
    } catch (error) {
      console.error("Failed to end event:", error);
    }
  };

  if (!event) {
    return (
      <div className="h-full bg-gray-100 border-b border-gray-200 flex items-center justify-center">
        <p className="text-gray-500 text-sm">No active event</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-blue-50 border-b border-blue-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-blue-900 text-base lg:text-lg truncate">
          {event.name}
        </h2>
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-2">
          <p className="text-blue-700 text-sm font-mono">{duration}</p>
          <p className="text-blue-600 text-xs">Started: {startTimeDisplay}</p>
        </div>
      </div>
      <button
        onClick={handleEndEvent}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ml-4"
      >
        End
      </button>
    </div>
  );
}
