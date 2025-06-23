import { initDb, createUser } from '../backend/db.js';

const [,, username, password, pin] = process.argv;
if (!username || !password) {
  console.log('Usage: node scripts/add-user.js <username> <password> [pin]');
  process.exit(1);
}

initDb();
createUser(username, password, pin);
console.log('User added');

