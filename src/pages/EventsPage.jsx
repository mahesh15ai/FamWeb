import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
} from "lucide-react";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../api/eventService";
import { getIndianHolidays } from "../api/holidayService";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

export default function EventsPage() {
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'calendar'
  const [filterType, setFilterType] = useState("all"); // 'all' | 'upcoming' | 'past'

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch Family Events
  const fetchEventsList = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data.results || []);
    } catch (err) {
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsList();
  }, []);

  // Fetch Public Indian Holidays on Calendar Year Change
  useEffect(() => {
    const fetchHolidays = async () => {
      const year = currentDate.getFullYear();
      const list = await getIndianHolidays(year);
      setHolidays(list);
    };

    fetchHolidays();
  }, [currentDate]);

  // Combine Custom Family Events & Public Festivals
  const allCalendarEvents = useMemo(() => {
    return [...events, ...holidays];
  }, [events, holidays]);

  // Filtered Events for List View
  const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (filterType === "upcoming") {
      return events.filter((e) => e.start_date >= todayStr);
    }
    if (filterType === "past") {
      return events.filter((e) => e.start_date < todayStr);
    }
    return events;
  }, [events, filterType]);

  // Calendar Helpers
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Open Create / Edit Modal
  const handleOpenModal = (eventObj = null) => {
    if (eventObj) {
      setEditingEvent(eventObj);
      setTitle(eventObj.title);
      setDescription(eventObj.description || "");
      setStartDate(eventObj.start_date || "");
      setStartTime(eventObj.start_time || "");
      setLocation(eventObj.location || "");
    } else {
      setEditingEvent(null);
      setTitle("");
      setDescription("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setStartTime("18:00");
      setLocation("");
    }
    setShowModal(true);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      toast.error("Title and start date are required.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      start_date: startDate,
      start_time: startTime || null,
      location: location.trim() || null,
    };

    try {
      setSubmitting(true);
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        toast.success("Event updated successfully!");
      } else {
        await createEvent(payload);
        toast.success("New event created successfully!");
      }
      setShowModal(false);
      fetchEventsList();
    } catch (err) {
      toast.error("Failed to save event.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (eventId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteEvent(eventId);
      toast.success("Event deleted.");
      setEvents((prev) => prev.filter((item) => item.id !== eventId));
    } catch (err) {
      toast.error("Failed to delete event.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
              <CalendarIcon className="w-7 h-7 text-brand-600" />
              Family Events & Calendar
            </h1>
            <p className="text-xs font-semibold text-stone-500 mt-1">
              Plan family celebrations, birthdays, reunions, and track Indian holidays in one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="bg-stone-100 p-1 rounded-2xl flex items-center border border-stone-200">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Calendar
              </button>
            </div>

            <button
              onClick={() => handleOpenModal(null)}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus size={16} />
              Add Event
            </button>
          </div>
        </div>

        {/* View Content */}
        {loading ? (
          <div className="h-64 bg-stone-200 rounded-3xl animate-pulse" />
        ) : viewMode === "list" ? (
          /* LIST VIEW */
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <button
                onClick={() => setFilterType("all")}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer ${
                  filterType === "all"
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100"
                }`}
              >
                All ({events.length})
              </button>
              <button
                onClick={() => setFilterType("upcoming")}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer ${
                  filterType === "upcoming"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilterType("past")}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer ${
                  filterType === "past"
                    ? "bg-stone-600 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100"
                }`}
              >
                Past
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-stone-800">No Events Found</h3>
                <button
                  onClick={() => handleOpenModal(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline pt-1 cursor-pointer"
                >
                  + Add First Event
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-block bg-brand-50 text-brand-700 text-[11px] font-bold px-3 py-1 rounded-xl border border-brand-100">
                          📅 {new Date(item.start_date).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-stone-900">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-stone-500 leading-relaxed">{item.description}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs font-medium text-stone-500 gap-2">
                      <div className="flex items-center gap-3">
                        {item.start_time && (
                          <span className="flex items-center gap-1 text-stone-600">
                            <Clock size={13} /> {item.start_time}
                          </span>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1 text-stone-600">
                            <MapPin size={13} /> {item.location}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <User size={12} /> {item.created_by_name || "Member"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* CALENDAR VIEW */
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 space-y-6 shadow-xs">
            {/* Month Controller */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-xs font-bold text-stone-400 py-2">
                  {day}
                </div>
              ))}

              {/* Offset Empty Days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 bg-stone-50/50 rounded-2xl" />
              ))}

              {/* Days of Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDay = String(dayNum).padStart(2, "0");
                const formattedMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
                const dateStr = `${currentDate.getFullYear()}-${formattedMonth}-${formattedDay}`;

                const dayItems = allCalendarEvents.filter(
                  (e) => e.start_date === dateStr
                );
                const isToday =
                  new Date().toISOString().split("T")[0] === dateStr;

                return (
                  <div
                    key={dayNum}
                    className={`h-24 p-2 rounded-2xl border flex flex-col justify-between text-left transition-all ${
                      isToday
                        ? "bg-brand-50/60 border-brand-300 ring-2 ring-brand-400/20"
                        : "bg-white border-stone-200/70 hover:border-stone-300"
                    }`}
                  >
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? "bg-brand-600 text-white" : "text-stone-700"
                      }`}
                    >
                      {dayNum}
                    </span>

                    <div className="space-y-1 overflow-y-auto max-h-14">
                      {dayItems.map((item, idx) => (
                        <div
                          key={item.id || `item-${idx}`}
                          onClick={() => !item.isFestival && handleOpenModal(item)}
                          className={`text-[10px] font-bold p-1 rounded-lg truncate ${
                            item.isFestival
                              ? "bg-amber-100 text-amber-900 border border-amber-200/80 cursor-default"
                              : "bg-stone-900 text-white cursor-pointer hover:bg-brand-600 transition-colors"
                          }`}
                          title={item.title}
                        >
                          {item.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add / Edit Event Modal */}
        {showModal && (
          <div
            onClick={() => setShowModal(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-100"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-base font-bold text-stone-900">
                  {editingEvent ? "Edit Event" : "Add New Event"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Rahul's Birthday 🎂, Family Trip"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pune Resort / Home"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Additional event details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Saving..." : "Save Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}