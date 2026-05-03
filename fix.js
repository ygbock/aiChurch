const fs=require('fs'); 
let content = fs.readFileSync('firestore.rules.bak', 'utf8'); 
content = content.replace(/!data\.keys\(\)\.contains\('([^']+)'\)/g, "!('$1' in data)"); 
// And I also recall seeing `allow read, list:` in firestore.rules maybe? NO, `allow read, list` is ok in rules_version 2? Actually, `allow read, list` could be redundant but let's leave it.
// Wait, what if there's other `.contains()` calls?
content = content.replace(/\.contains\(/g, ".hasAny(["); // DANGEROUS! Let me not do that.
// And put back the `yearly` edit:
content = content.replace(/ \['daily', 'weekly', 'monthly'\]/g, " ['daily', 'weekly', 'monthly', 'yearly']");
// And replace `recurrence is map` with `recurrence == null || (recurrence is map)` in isValidEvent:
let fixEvent = content.replace(
  "(!('recurrence' in data) || (\n               data.recurrence is map &&\n               data.recurrence.isRecurring is bool", 
  "(!('recurrence' in data) || (\n               data.recurrence == null || (\n                 data.recurrence is map &&\n                 data.recurrence.isRecurring is bool"
);
content = fixEvent;

fs.writeFileSync('firestore.rules', content);
