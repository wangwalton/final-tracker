"use client";

import { useState, useEffect } from "react";
import {
  getDayAggregation,
  getWeekAggregation,
  getAllEvents,
  type SelectEvent,
} from "../../db/actions";

type Tab = "day" | "week" | "detailed";

interface AggregationData {
  name: string;
  duration: number;
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<Tab>("day");
  const [dayData, setDayData] = useState<AggregationData[]>([]);
  const [weekData, setWeekData] = useState<AggregationData[]>([]);
  const [detailedEvents, setDetailedEvents] = useState<SelectEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date();

      switch (activeTab) {
        case "day":
          const dayResult = await getDayAggregation(today);
          setDayData(dayResult);
          break;
        case "week":
          const weekResult = await getWeekAggregation(today);
          setWeekData(weekResult);
          break;
        case "detailed":
          const events = await getAllEvents(50, 0);
          setDetailedEvents(events);
          break;
      }
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if it's today or yesterday
    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const calculateEventDuration = (event: SelectEvent): number => {
    if (!event.endTime) return 0;
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const groupEventsByDate = (events: SelectEvent[]) => {
    const groups: { [key: string]: SelectEvent[] } = {};

    events.forEach((event) => {
      const date = formatDate(event.startTime);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });

    // Sort events within each group by start time (12am at top)
    Object.keys(groups).forEach((date) => {
      groups[date].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return groups;
  };

  const renderAggregationView = (data: AggregationData[], title: string) => (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No data available</div>
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{item.name}</span>
                <span className="text-blue-600 font-semibold">
                  {formatDuration(item.duration)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDetailedView = () => {
    const groupedEvents = groupEventsByDate(detailedEvents);
    const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
      // Handle "Today" and "Yesterday" specially
      if (a === "Today") return -1;
      if (b === "Today") return 1;
      if (a === "Yesterday") return -1;
      if (b === "Yesterday") return 1;

      // For other dates, sort by actual date
      const dateA = new Date(groupedEvents[a][0].startTime);
      const dateB = new Date(groupedEvents[b][0].startTime);
      return dateB.getTime() - dateA.getTime();
    });

    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Detailed Events</h3>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No events found</div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div
                key={date}
                className="bg-white border border-gray-200 rounded-lg"
              >
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-700">{date}</h4>
                </div>
                <div className="p-3 space-y-2">
                  {groupedEvents[date].map((event) => {
                    const duration = calculateEventDuration(event);
                    return (
                      <div
                        key={event.id}
                        className="flex justify-between items-center py-2"
                      >
                        <div>
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatTime(event.startTime)}
                            {event.endTime
                              ? ` - ${formatTime(event.endTime)}`
                              : " (ongoing)"}
                          </div>
                        </div>
                        {duration > 0 && (
                          <div className="text-blue-600 font-medium">
                            {formatDuration(duration)}
                          </div>
                        )}
                        {!event.endTime && (
                          <div className="text-green-600 font-medium text-sm">
                            Active
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("day")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "day"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Day
        </button>
        <button
          onClick={() => setActiveTab("week")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "week"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setActiveTab("detailed")}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === "detailed"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Events
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "day" && renderAggregationView(dayData, "Today")}
        {activeTab === "week" && renderAggregationView(weekData, "This Week")}
        {activeTab === "detailed" && renderDetailedView()}
      </div>
    </div>
  );
}
