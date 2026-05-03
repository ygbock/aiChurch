const fs=require('fs'); 
let content = fs.readFileSync('firestore.rules.bak', 'utf8'); 
console.log('BEFORE:', content.includes('.contains('));
content = content.replace(/!data\.keys\(\)\.contains\('([^']+)'\)/g, "!('$1' in data)"); 
console.log('AFTER:', content.includes('.contains('));
fs.writeFileSync('firestore.rules', content);
