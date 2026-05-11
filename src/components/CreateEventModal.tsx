import React, { useState } from 'react';
import { X, Send, Calendar as CalendarIcon, MapPin, Video, Bell, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface EventDraft {
  name: string;
  description: string;
  startTime: string; // ISO string
  endTime: string | null;
  location: string;
  whatsappCallLink: boolean;
  reminder: string;
  allowGuests: boolean;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: EventDraft) => void;
}

export default function CreateEventModal({ isOpen, onClose, onSubmit }: CreateEventModalProps) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const formattedToday = `${yyyy}-${mm}-${dd}`;
  
  const currentHour = today.getHours();
  // Round up to next hour (or keep 23:00 if 23)
  const nextHour = currentHour >= 23 ? 23 : currentHour + 1;
  const formattedTime = `${String(nextHour).padStart(2, '0')}:00`;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(formattedToday);
  const [startTime, setStartTime] = useState(formattedTime);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showEndTime, setShowEndTime] = useState(false);
  const [location, setLocation] = useState('');
  const [whatsappCallLink, setWhatsappCallLink] = useState(false);
  const [reminder, setReminder] = useState('1 hour before');
  const [allowGuests, setAllowGuests] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !startTime) {
      setErrorMsg('Please provide an event name and start time.');
      return;
    }
    
    // Combine date and time
    const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
    let endDateTime = null;
    if (showEndTime && endDate && endTime) {
      endDateTime = new Date(`${endDate}T${endTime}`).toISOString();
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      startTime: startDateTime,
      endTime: endDateTime,
      location: location.trim(),
      whatsappCallLink,
      reminder,
      allowGuests
    });
    
    // Reset state
    setName('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setShowEndTime(false);
    setLocation('');
    setWhatsappCallLink(false);
    setReminder('1 hour before');
    setAllowGuests(false);
    setErrorMsg('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[200] flex flex-col justify-end md:justify-center items-center backdrop-blur-sm sm:p-4 md:p-6">
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative w-full md:max-w-lg bg-[#111b21] md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b border-white/10 shrink-0 bg-[#111b21] sticky top-0 z-10">
            <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-white flex-1 relative bottom-[1px]">Create Event</h2>
          </div>

          <div className="p-4 flex-1 overflow-y-auto no-scrollbar flex flex-col gap-8 pb-32">
            {/* Event Name & Description */}
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
              <input 
                type="text"
                placeholder="Event name (Required)"
                value={name}
                onChange={e => { setName(e.target.value); setErrorMsg(''); }}
                className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-slate-500 focus:outline-none"
              />
              <input 
                type="text"
                placeholder="Description (Optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-transparent text-slate-300 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Date & Time */}
            <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
              <div className="flex items-start gap-4">
                <CalendarIcon size={24} className="text-slate-400 shrink-0 mt-2" />
                <div className="flex-1 flex gap-4">
                  <input 
                    type="date"
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); setErrorMsg(''); }}
                    className="w-full bg-transparent text-white focus:outline-none"
                    style={{ colorScheme: 'dark' }}
                  />
                  <input 
                    type="time"
                    value={startTime}
                    onChange={e => { setStartTime(e.target.value); setErrorMsg(''); }}
                    className="w-24 bg-transparent text-white focus:outline-none text-right"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 pl-10">
                {!showEndTime ? (
                  <button 
                    onClick={() => setShowEndTime(true)}
                    className="text-slate-300 font-medium hover:text-white"
                  >
                    Add end time
                  </button>
                ) : (
                  <div className="flex-1 flex gap-4">
                    <input 
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    />
                    <input 
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-24 bg-transparent text-white focus:outline-none text-right"
                      style={{ colorScheme: 'dark' }}
                      placeholder="End time"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Location & Call Link */}
            <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <MapPin size={24} className="text-slate-400 shrink-0" />
                <input 
                  type="text"
                  placeholder="Add location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-transparent text-white placeholder:text-slate-300 focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-4">
                <Video size={24} className="text-slate-400 shrink-0" />
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-white font-medium">WhatsApp call link</span>
                  <button 
                    onClick={() => setWhatsappCallLink(!whatsappCallLink)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${whatsappCallLink ? 'bg-[#00a884]' : 'bg-slate-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${whatsappCallLink ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Reminder */}
            <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
              <div className="flex items-start gap-4">
                <Bell size={24} className="text-slate-400 shrink-0 mt-1" />
                <div className="flex flex-col">
                  <span className="text-white font-medium">Reminder</span>
                  <select 
                    value={reminder}
                    onChange={e => setReminder(e.target.value)}
                    className="bg-transparent text-slate-400 text-sm focus:outline-none mt-1 appearance-none cursor-pointer"
                  >
                    <option value="At start of event" className="bg-[#111b21]">At start of event</option>
                    <option value="15 minutes before" className="bg-[#111b21]">15 minutes before</option>
                    <option value="30 minutes before" className="bg-[#111b21]">30 minutes before</option>
                    <option value="1 hour before" className="bg-[#111b21]">1 hour before</option>
                    <option value="1 day before" className="bg-[#111b21]">1 day before</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Allow Guests */}
            <div className="flex items-center gap-4">
              <div className="flex-1 flex flex-col">
                <span className="text-white font-medium">Allow guests</span>
                <span className="text-slate-400 text-sm truncate">Allow people to bring one additional guest</span>
              </div>
              <button 
                onClick={() => setAllowGuests(!allowGuests)}
                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center shrink-0 ${allowGuests ? 'bg-[#00a884]' : 'bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${allowGuests ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

          </div>

          {/* Submit */}
          {errorMsg && <div className="absolute bottom-24 left-6 right-6 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm text-center font-medium shadow-lg z-20 animate-pulse">{errorMsg}</div>}
          <div className="absolute right-6 bottom-6 flex justify-end shrink-0 z-20">
            <button 
              onClick={handleSubmit}
              disabled={!name.trim() || !startDate || !startTime}
              className="w-14 h-14 bg-[#00a884] rounded-xl flex items-center justify-center text-[#111b21] hover:bg-[#008f6f] disabled:opacity-50 disabled:hover:bg-[#00a884] transition-colors shadow-lg shadow-[#00a884]/20 disabled:cursor-not-allowed"
            >
              <Send size={24} className="ml-1 fill-current" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
