import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { AppPanel } from '../../components/layout/AppPanel';
import { invoke } from '@tauri-apps/api/tauri';
import { CalendarEvent } from '../../types';

export const TimeAI: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);

  const loadEvents = async () => {
    try {
      const ev = await invoke<CalendarEvent[]>('load_events');
      setEvents(ev);
    } catch (err) {
      console.error('load_events failed', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const addTask = () => {
    if (!taskInput) return;
    setTasks(prev => [...prev, taskInput]);
    setTaskInput('');
  };

  const handleSelect = async (sel: any) => {
    const title = prompt('Event Title');
    if (!title) return;
    const event: CalendarEvent = {
      id: 0,
      title,
      start: sel.startStr,
      end: sel.endStr,
      tasks: tasks.join('\n') || undefined,
    };
    try {
      await invoke<number>('save_event', { event });
      setTasks([]);
      loadEvents();
    } catch (err) {
      console.error('save_event failed', err);
    }
  };

  const smartSlot = async () => {
    try {
      const payload = JSON.stringify({ tasks });
      const res = await invoke<string>('call_scheduler', { action: 'smart_slot', payload });
      alert(res);
    } catch (err) {
      console.error('smart_slot failed', err);
    }
  };

  const reschedule = async () => {
    try {
      const payload = JSON.stringify({ events });
      const res = await invoke<string>('call_scheduler', { action: 'reschedule', payload });
      alert(res);
    } catch (err) {
      console.error('reschedule failed', err);
    }
  };

  return (
    <AppPanel>
      <div className="flex items-center mb-2">
        <input
          className="flex-grow text-sm rounded border border-gray-300 bg-transparent px-2 py-1"
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          placeholder="New Task"
        />
        <button className="ml-2 px-2 py-1 text-xs rounded bg-blue-500 text-white" onClick={addTask}>
          Add
        </button>
      </div>
      <ul className="mb-4 space-y-1">
        {tasks.map((t, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-blue-500" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <div className="flex-grow">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          selectable
          select={handleSelect}
          events={events}
          height="100%"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button className="px-2 py-1 text-xs rounded bg-green-500 text-white" onClick={smartSlot}>
          Smart Slot
        </button>
        <button className="px-2 py-1 text-xs rounded bg-purple-500 text-white" onClick={reschedule}>
          Reschedule
        </button>
      </div>
    </AppPanel>
  );
};

export default TimeAI;
