import sqlite3
import bcrypt

# IMPORTANT: Update this to the absolute path of the DB file you have open in VS Code
DB_PATH = "backend/data/processed/palashvani.db" 
EMAIL = "test100100@gmail.com"
NEW_PASSWORD = "password123"

# Generate a fresh bcrypt hash
new_hash = bcrypt.hashpw(NEW_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (new_hash, EMAIL))
conn.commit()
conn.close()
print(f"Password for {EMAIL} successfully updated to: {NEW_PASSWORD}")