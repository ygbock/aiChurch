const fs = require('fs');
let code = fs.readFileSync('src/pages/MinistryDashboard.tsx', 'utf8');
code = code.replace(
  /) \: \(\n.*<div className="hidden sm:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">/g,
  ") : (\n                <>\n                 <div className=\"hidden sm:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto\">"
);
code = code.replace(
  /                  \<\/table\>\n                \<\/div\>\n                \<div className="grid grid-cols-1 gap-4 sm:hidden">/g,
  "                  </table>\n                </div>\n                <div className=\"grid grid-cols-1 gap-4 sm:hidden\">"
);
code = code.replace(
  /                  \}\)\}\n                \<\/div\>\n               \)/g,
  "                  })  }\n                </div>\n                </>\n               )"
);
fs.writeFileSync('src/pages/MinistryDashboard.tsx', code);
