const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

function initDB() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS campaigns (
            id TEXT PRIMARY KEY,
            companyName TEXT,
            websiteUrl TEXT,
            serviceOffering TEXT,
            context TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            researchData TEXT,
            analysisData TEXT,
            mappingData TEXT,
            pitchData TEXT,
            criticData TEXT,
            status TEXT DEFAULT 'PENDING'
        );
    `);
    console.log('Database initialized successfully.');
}

module.exports = {
    db,
    initDB
};
