const Database = require('better-sqlite3'); const db = new Database('prisma/dev.db'); console.log(db.prepare('SELECT * FROM Attendance').all());
