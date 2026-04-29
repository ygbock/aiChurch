/**
 * Utility for church specific recurring event scheduling logic.
 */

export interface ChurchEvent {
  title: string;
  time: string;
  category: string;
}

export function getScheduledEvents(date: Date, isChoir = false, isUshering = false, isTechnical = false): ChurchEvent[] {
  const events: ChurchEvent[] = [];
  const dayOfWeek = date.getDay(); // 0 is Sunday, 2 is Tuesday, etc.
  const dayOfMonth = date.getDate();
  const month = date.getMonth(); // 0 is January
  const nthDay = Math.ceil(dayOfMonth / 7);

  // Sundays
  if (dayOfWeek === 0) {
    if (nthDay === 1) {
      if (month === 0) {
        events.push({ title: 'Covenant Sunday', time: '08:00 AM - 11:30 AM', category: 'General Combined' });
      } else {
        // Quarterly assumption: Mar, Jun, Sep, Dec
        const isQuarterly = (month + 1) % 3 === 0;
        if (isQuarterly) {
          events.push({ title: 'District Combined Service', time: '08:00 AM - 11:30 AM', category: 'District Combined' });
        } else {
          events.push({ title: 'Wonder Sunday', time: '08:00 AM - 11:30 AM', category: 'Branch Level' });
        }
      }
    } else if (nthDay === 2) {
      if (month === 0) {
        events.push({ title: 'Divine Service', time: '08:00 AM - 11:30 AM', category: 'Branch Level' });
      } else {
        events.push({ title: 'General Combined Service', time: '08:00 AM - 11:30 AM', category: 'General Combined' });
      }
    } else {
      events.push({ title: 'Divine Service', time: '08:00 AM - 11:30 AM', category: 'Branch Level' });
    }
  }

  // Weekdays
  if (dayOfWeek === 2) { // Tuesday
    events.push({ title: 'Weekly Bible Studies', time: '06:00 PM - 08:00 PM', category: 'Teaching' });
  }
  if (dayOfWeek === 4) { // Thursday
    events.push({ title: 'Weekly Prayer Meetings', time: '06:00 PM - 08:00 PM', category: 'Prayer' });
  }
  if (dayOfWeek === 5) { // Friday
    events.push({ title: 'Night Vigil', time: '10:00 PM - 02:00 AM', category: 'Vigil' });
  }
  if (dayOfWeek === 6) { // Saturday
    if (isUshering) events.push({ title: 'Church Cleaning & Preparation', time: '08:00 AM - 10:00 AM', category: 'Service' });
    if (isChoir) events.push({ title: 'Choir Practice', time: '04:00 PM - 06:30 PM', category: 'Practice' });
    events.push({ title: 'Evangelism & Follow-up', time: '10:00 AM - 12:00 PM', category: 'Outreach' });
    events.push({ title: 'Home Fellowship', time: '05:00 PM - 06:30 PM', category: 'Fellowship' });
  }

  return events;
}
