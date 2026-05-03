const fs=require('fs'); 
let content = fs.readFileSync('firestore.rules.bak', 'utf8'); 
content = content.replace(/!data\.keys\(\)\.contains\('([^']+)'\)/g, "!('$1' in data)"); 
fs.writeFileSync('firestore.rules', content);
