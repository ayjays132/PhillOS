import { initDb, createUser } from '../backend/db.js';

const [,, username, password] = process.argv;
if (!username || !password) {
  console.log('Usage: node scripts/add-user.js <username> <password>');
  process.exit(1);
}

initDb();
createUser(username, password);
console.log('User added');

