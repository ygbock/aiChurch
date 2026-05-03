const fs=require('fs'); 
let content = fs.readFileSync('firestore.rules.bak', 'utf8'); 
content = content.replace(/!data\.keys\(\)\.contains\('([^']+)'\)/g, "!('$1' in data)"); 

content = content.replace(/ \['daily', 'weekly', 'monthly'\]/g, " ['daily', 'weekly', 'monthly', 'yearly']");

let fixEvent = content.replace(
  "(!('recurrence' in data) || (\n               data.recurrence is map &&\n               data.recurrence.isRecurring is bool", 
  "(!('recurrence' in data) || (\n               data.recurrence == null || (\n                 data.recurrence is map &&\n                 data.recurrence.isRecurring is bool"
);
content = fixEvent;

let fixCalendarEvent = content.replace(
  "(!('recurrence' in data) || (\n               data.recurrence is map &&\n               data.recurrence.isRecurring is bool", 
  "(!('recurrence' in data) || (\n               data.recurrence == null || (\n                 data.recurrence is map &&\n                 data.recurrence.isRecurring is bool"
);
content = fixCalendarEvent;

fs.writeFileSync('firestore.rules', content);
