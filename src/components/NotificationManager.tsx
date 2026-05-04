import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from './FirebaseProvider';
import { format } from 'date-fns';
import { showBrowserNotification, requestNotificationPermission } from '../lib/notifications';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Clock, MessageSquare } from 'lucide-react';

export default function NotificationManager() {
  const { user, profile } = useFirebase();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<any[]>([]);
  const notifiedReminders = useRef<Set<string>>(new Set());
  const notifiedAppts = useRef<Set<string>>(new Set());
  const notifiedMessages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Initial permission request
    requestNotificationPermission();

    const path = `users/${user.uid}/reminders`;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Listen for today's pending reminders
    const q = query(
      collection(db, path),
      where('date', '==', todayStr),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReminders(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, path));

    return () => unsubscribe();
  }, [user]);

  // Listen for appointment status changes
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'appointments'),
      where('requesterId', '==', user.uid),
      where('status', 'in', ['confirmed', 'cancelled'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const appt = { id: change.doc.id, ...change.doc.data() } as any;
          
          // Only notify if status actually changed to a terminal state
          const title = appt.status === 'confirmed' ? 'Session Approved!' : 'Session Declined';
          const body = appt.staffFeedback 
            ? `Feedback: ${appt.staffFeedback}`
            : `Your session "${appt.title}" has been ${appt.status}.`;

          showBrowserNotification(title, {
            body,
            tag: `appt-${appt.id}`
          });

          toast(title, {
            description: body,
            duration: 10000,
            action: {
              label: 'View',
              onClick: () => navigate('/calendar')
            }
          });
        }
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'appointments (status changes)'));

    return () => unsubscribe();
  }, [user]);

  // Automated Appointment Reminders (30 mins before)
  useEffect(() => {
    if (!user || profile?.notificationPrefs?.reminders === false) return;

    let unsubscribeAppts: (() => void) | null = null;
    let notifiedApptsLocal = new Set<string>();

    const checkApptReminders = () => {
      const now = new Date();
      
      const q = query(
        collection(db, 'appointments'),
        where('requesterId', '==', user.uid),
        where('status', '==', 'confirmed'),
        where('date', '==', format(now, 'yyyy-MM-dd'))
      );

      if (unsubscribeAppts) {
        unsubscribeAppts();
      }

      unsubscribeAppts = onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach(doc => {
          const appt = doc.data();
          const [hours, minutes] = appt.time.split(':').map(Number);
          const apptTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          
          const diffInMinutes = (apptTime.getTime() - now.getTime()) / (1000 * 60);
          
          // Notify if appointment is in exactly 30 minutes (or within a 1 min window)
          if (diffInMinutes > 29 && diffInMinutes <= 31 && !notifiedAppts.current.has(doc.id) && !notifiedApptsLocal.has(doc.id)) {
            notifiedAppts.current.add(doc.id);
            notifiedApptsLocal.add(doc.id);
            const title = "Session Starting Soon!";
            const body = `Your session "${appt.title}" starts in 30 minutes with ${appt.staffName || 'Staff'}.`;

            showBrowserNotification(title, { body, tag: `remind-${doc.id}` });
            toast.info(title, {
              description: body,
              icon: <Clock size={16} />,
              duration: 15000,
              action: {
                label: 'Details',
                onClick: () => navigate('/calendar')
              }
            });
          }
        });
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'appointments (upcoming)'));
    };

    const interval = setInterval(checkApptReminders, 60000); // Check every minute
    checkApptReminders(); // Initial check

    return () => {
      clearInterval(interval);
      if (unsubscribeAppts) unsubscribeAppts();
    };
  }, [user, profile?.notificationPrefs?.reminders]);

  // Real-time Chat Notifications
  useEffect(() => {
    if (!user || profile?.notificationPrefs?.news === false) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const chat = change.doc.data();
          const lastMsgAt = chat.lastMessageAt?.toDate();
          
          // Only notify if message is recent (within last 10 seconds) and not from current user
          if (lastMsgAt && (new Date().getTime() - lastMsgAt.getTime()) < 10000) {
            // We need to verify if the last message was from the other person
            // For now, simpler: notify if it's a modification and we haven't notified for this specific timestamp yet
            const notificationId = `${change.doc.id}-${lastMsgAt.getTime()}`;
            
            if (!notifiedMessages.current.has(notificationId)) {
              notifiedMessages.current.add(notificationId);
              
              const title = "New Signal Received";
              const body = chat.lastMessage || "You have a new message.";
              
              toast.message(title, {
                description: body,
                icon: <MessageSquare size={16} />,
                action: {
                  label: 'Reply',
                  onClick: () => navigate(`/messages/${change.doc.id}`)
                }
              });
              
              showBrowserNotification(title, { body, tag: `chat-${change.doc.id}` });
            }
          }
        }
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'chats (notifications)'));

    return () => unsub();
  }, [user, profile, navigate]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      reminders.forEach(rem => {
        if (notifiedReminders.current.has(rem.id)) return;

        // Parse time (expecting HH:mm)
        const [hours, minutes] = rem.time.split(':').map(Number);
        const reminderMinutes = hours * 60 + minutes;

        // If the reminder is for right now (or within the last minute)
        if (reminderMinutes === currentMinutes) {
          triggerNotification(rem);
        }
      });
    };

    const triggerNotification = (rem: any) => {
      notifiedReminders.current.add(rem.id);
      
      // Browser Notification
      showBrowserNotification(rem.title, {
        body: rem.description || "Reminder from your FaithFlow Calendar",
        tag: rem.id
      });

      // UI Toast
      toast(rem.title, {
        description: rem.description || "It's time!",
        duration: 10000,
        action: {
          label: 'View',
          onClick: () => navigate('/calendar')
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkReminders, 10000); // Check every 10s to be responsive but not heavy
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [reminders]);

  return null; // This component doesn't render anything
}
