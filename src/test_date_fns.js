const { format } = require('date-fns');
try {
  console.log(format('2025-01-01', 'yyyy-MM-dd'));
} catch (err) {
  console.log(err.name, err.message);
}
