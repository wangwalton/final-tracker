"use client";

import { useState, useEffect } from "react";
import {
  getDayAggregation,
  getWeekAggregation,
  getAllEvents,
  updateEvent,
  deleteEvent,
  type SelectEvent,
} from "../../db/actions";

type Tab = "detailed" | "day" | "week";

interface AggregationData {
  name: string;
  duration: number;
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<Tab>("detailed");
  const [dayData, setDayData] = useState<AggregationData[]>([]);
  const [weekData, setWeekData] = useState<AggregationData[]>([]);
  const [detailedEvents, setDetailedEvents] = useState<SelectEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    startTime: "",
    endTime: "",
    hasEndTime: false,
  });

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

  const formatDateTimeLocal = (date: string | Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
        <h3 className="text-lg font-semibold mb-4">Events</h3>
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
                    const isEditing = editingEvent === event.id;

                    return (
                      <div
                        key={event.id}
                        className="border border-gray-100 rounded-lg p-3"
                      >
                        {isEditing ? (
                          <div className="space-y-2 lg:space-y-3">
                            {/* Event Name and Start Time - Inline */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Event Name
                                </label>
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      name: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded text-xs lg:text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Event name"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="datetime-local"
                                  value={editForm.startTime}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      startTime: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded text-xs lg:text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* End Time Options - 3-way toggle in one line */}
                            <div>
                              <div className="flex items-center space-x-4 lg:space-x-6 mb-2">
                                <label className="flex items-center text-xs">
                                  <input
                                    type="radio"
                                    checked={!editForm.hasEndTime}
                                    onChange={() =>
                                      setEditForm({
                                        ...editForm,
                                        hasEndTime: false,
                                        endTime: "",
                                      })
                                    }
                                    className="mr-1"
                                  />
                                  No end time
                                </label>
                                <label className="flex items-center text-xs">
                                  <input
                                    type="radio"
                                    checked={
                                      editForm.hasEndTime &&
                                      editForm.endTime !== ""
                                    }
                                    onChange={() =>
                                      setEditForm({
                                        ...editForm,
                                        hasEndTime: true,
                                      })
                                    }
                                    className="mr-1"
                                  />
                                  End time
                                </label>
                              </div>

                              {/* Conditional input */}
                              {editForm.hasEndTime && (
                                <input
                                  type="datetime-local"
                                  value={editForm.endTime}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      endTime: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-gray-300 rounded text-xs lg:text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="End time"
                                />
                              )}
                              {!editForm.hasEndTime && (
                                <p className="text-xs text-gray-500 italic">
                                  Event will continue until manually ended
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 bg-green-500 text-white text-xs lg:text-sm rounded hover:bg-green-600 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-500 text-white text-xs lg:text-sm rounded hover:bg-gray-600 font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{event.name}</div>
                              <div className="text-sm text-gray-500">
                                {formatTime(event.startTime)}
                                {event.endTime
                                  ? ` - ${formatTime(event.endTime)}`
                                  : " (ongoing)"}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {duration > 0 && (
                                <div className="text-blue-600 font-medium text-sm">
                                  {formatDuration(duration)}
                                </div>
                              )}
                              {!event.endTime && (
                                <div className="text-green-600 font-medium text-xs">
                                  Active
                                </div>
                              )}
                              <button
                                onClick={() => handleEditEvent(event)}
                                className="text-blue-500 hover:text-blue-700 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteEvent(event.id, event.name)
                                }
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Delete
                              </button>
                            </div>
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

  const handleEditEvent = (event: SelectEvent) => {
    setEditingEvent(event.id);
    setEditForm({
      name: event.name,
      startTime: formatDateTimeLocal(event.startTime),
      endTime: event.endTime ? formatDateTimeLocal(event.endTime) : "",
      hasEndTime: !!event.endTime,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;

    try {
      const updateData = {
        name: editForm.name,
        startTime: new Date(editForm.startTime),
        endTime:
          editForm.hasEndTime && editForm.endTime
            ? new Date(editForm.endTime)
            : null,
      };

      await updateEvent(editingEvent, updateData);
      setEditingEvent(null);
      loadData(); // Refresh the data
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setEditForm({ name: "", startTime: "", endTime: "", hasEndTime: false });
  };

  const handleDeleteEvent = async (eventId: number, eventName: string) => {
    if (confirm(`Are you sure you want to delete "${eventName}"?`)) {
      try {
        await deleteEvent(eventId);
        loadData(); // Refresh the data
      } catch (error) {
        console.error("Failed to delete event:", error);
      }
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
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
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "detailed" && renderDetailedView()}
        {activeTab === "day" && renderAggregationView(dayData, "Today")}
        {activeTab === "week" && renderAggregationView(weekData, "This Week")}
      </div>
    </div>
  );
}
