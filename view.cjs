const fs=require('fs'); 
let c = fs.readFileSync('firestore.rules.bak', 'utf8'); 
c = c.replace(/!data\.keys\(\)\.contains\('([^']+)'\)/g, "!('$1' in data)");
console.log(c.substring(c.indexOf('    function isValidAppointment'), c.indexOf('    function isValidAttendance')));
