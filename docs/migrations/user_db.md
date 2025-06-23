# User Database Migration

PhillOS now stores credentials in `storage/phillos.db`. Existing installations
should initialize the new table and create an initial account.

1. Run `npm run setup-db` to ensure the database schema is up to date.
2. Add a user with `node scripts/add-user.js <name> <password>`.

The lock screen will authenticate against this database from now on.

