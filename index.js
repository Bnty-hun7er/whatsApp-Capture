const { Client } = require('whatsapp-web.js'); // WhatsApp API library
const qrcode = require('qrcode-terminal'); // QR code generator
const sqlite3 = require('sqlite3').verbose(); // SQLite3 library for database

// ---------------------- Database Setup ----------------------

// Create or connect to the SQLite database file
let db = new sqlite3.Database('./messages.db');

// Create 'messages' table if it doesn't already exist
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, 
    content TEXT, 
    timestamp INTEGER
  )
`, (err) => {
    if (err) {
        console.error("Error creating table:", err);
    } else {
        console.log("Database and table set up successfully.");
    }
});

// ---------------------- WhatsApp Client Setup ----------------------

// Initialize the WhatsApp Web client
const client = new Client();

// Generate a QR code for authentication
client.on('qr', (qr) => {
    console.log("Scan this QR code with your WhatsApp to authenticate:");
    qrcode.generate(qr, { small: true });
});

// Log when the client is ready
client.on('ready', () => {
    console.log("WhatsApp Web Client is ready!");
});

// Listen for incoming messages
client.on('message', async (message) => {
    console.log(`Message received: ${message.body}`);

    // Save the message into the database
    let stmt = db.prepare("INSERT OR REPLACE INTO messages (id, content, timestamp) VALUES (?, ?, ?)");
    stmt.run(message.id._serialized, message.body, Date.now());
    stmt.finalize();

    console.log("Message saved to the database.");

    // Handle media messages
    if (message.hasMedia) {
        const media = await message.downloadMedia();
        console.log("Media message received:", media.filename || "Unnamed file");

        // Store media information (filename or data can be saved here)
        let mediaStmt = db.prepare("INSERT OR REPLACE INTO messages (id, content, timestamp) VALUES (?, ?, ?)");
        mediaStmt.run(message.id._serialized, "Media: " + media.filename || "Unnamed File", Date.now());
        mediaStmt.finalize();

        console.log("Media message saved to the database.");
    }
});

// Start the client
client.initialize();
