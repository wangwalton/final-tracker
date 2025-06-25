"use client";

import { useState, useEffect } from "react";
import { createEvent, getFrequentEventNames } from "../../db/actions";

interface EventInputProps {
  onEventCreated: () => void;
}

export default function EventInput({ onEventCreated }: EventInputProps) {
  const [frequentEvents, setFrequentEvents] = useState<
    { name: string; count: number }[]
  >([]);
  const [eventName, setEventName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(0);
  const [useEndTime, setUseEndTime] = useState(false);
  const [useNoDuration, setUseNoDuration] = useState(true);

  useEffect(() => {
    const loadFrequentEvents = async () => {
      try {
        const events = await getFrequentEventNames(8);
        setFrequentEvents(events);
      } catch (error) {
        console.error("Failed to load frequent events:", error);
      }
    };

    loadFrequentEvents();
  }, []);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      // Create local datetime string for the input
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const timeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      setStartTime(timeString);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (duration > 0 && startTime && !useNoDuration && !useEndTime) {
      // Parse the local datetime-local input value
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60 * 1000);

      // Format for datetime-local input
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, "0");
      const day = String(end.getDate()).padStart(2, "0");
      const hours = String(end.getHours()).padStart(2, "0");
      const minutes = String(end.getMinutes()).padStart(2, "0");
      const endTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

      setEndTime(endTimeString);
    }
  }, [duration, startTime, useNoDuration, useEndTime]);

  const handleQuickStart = async (name: string) => {
    try {
      await createEvent({
        name,
        startTime: new Date(), // This will be in local time
        endTime: null,
      });
      onEventCreated();
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !startTime) return;

    try {
      // Parse the local datetime-local input value
      const startDateTime = new Date(startTime);

      let endDateTime = null;
      if (useEndTime && endTime) {
        endDateTime = new Date(endTime);
      } else if (!useNoDuration && !useEndTime && duration > 0) {
        endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
      }
      // If useNoDuration is true, endDateTime stays null

      const eventData = {
        name: eventName,
        startTime: startDateTime,
        endTime: endDateTime,
      };

      await createEvent(eventData);
      onEventCreated();
      setEventName("");
      setEndTime("");
      setDuration(0);
      setUseNoDuration(true);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  return (
    <div className="h-full bg-white border-b lg:border-b-0 border-gray-200 p-4 lg:p-6">
      {/* Quick Input Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
        <div className="grid grid-cols-2 gap-2">
          {frequentEvents.map((event) => (
            <button
              key={event.name}
              onClick={() => handleQuickStart(event.name)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate"
            >
              {event.name}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Form */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-4">New Event</h3>

        <form onSubmit={handleDetailedSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter event name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <div className="flex flex-col space-y-2 mb-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useNoDuration}
                  onChange={() => {
                    setUseNoDuration(true);
                    setUseEndTime(false);
                  }}
                  className="mr-2"
                />
                No specific end time
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!useNoDuration && !useEndTime}
                  onChange={() => {
                    setUseNoDuration(false);
                    setUseEndTime(false);
                  }}
                  className="mr-2"
                />
                Duration (minutes)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useEndTime}
                  onChange={() => {
                    setUseEndTime(true);
                    setUseNoDuration(false);
                  }}
                  className="mr-2"
                />
                Specific end time
              </label>
            </div>

            {useEndTime ? (
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : !useNoDuration ? (
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="480"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                />
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Duration in minutes"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Event will continue until manually ended
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}
