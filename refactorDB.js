const fs = require('fs');
const path = require('path');

const asyncMethods = [
  'getUsers',
  'getUserByEmail',
  'getUserById',
  'createUser',
  'updateUser',
  'verifyShopkeeper',
  'getOrders',
  'getOrderById',
  'getOrdersByStudentId',
  'getPaidOrders',
  'createOrder',
  'updateOrderStatus',
  'updateOrderQR',
  'saveFile',
  'getFile',
  'deleteFile',
  'getTodayAnalytics',
  'getSubmissions',
  'getSubmissionsByStudent',
  'createSubmission',
  'updateSubmissionStatus',
  'addNoticeToSubmission'
];

function walk(dir, call) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p, call);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      call(p);
    }
  }
}

walk(path.join(__dirname, 'src', 'pages'), (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // For async methods, if there is a DB.call without await, rewrite it
  asyncMethods.forEach(method => {
    // Basic heuristics for rewriting
    // e.g. const x = DB.getPaidOrders();
    // -> const x = await DB.getPaidOrders();
    // Also mark the closest enclosing function as async... 
    // This is hard to do safely with regex.
  });
});
