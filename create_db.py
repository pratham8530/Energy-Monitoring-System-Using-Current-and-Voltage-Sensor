import sqlite3

def initialize_database():
    # Connect to the SQLite database (it will be created if it doesn't exist)
    connection = sqlite3.connect('energy.db')
    cursor = connection.cursor()

    # Create a table to store energy-saving tips
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS energy_tips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tip TEXT NOT NULL
    )
    ''')

    # Insert multiple energy-saving tips only if the table is empty
    cursor.execute("SELECT COUNT(*) FROM energy_tips")
    if cursor.fetchone()[0] == 0:  # Check if the table is empty
        energy_tips = [
            ('Turn off lights when not in use.',),
            ('Unplug devices that are not being used.',),
            ('Use energy-efficient light bulbs.',),
            ('Install a programmable thermostat.',),
            ('Seal windows and doors to prevent heat loss.',),
            ('Use appliances during off-peak hours.',),
            ('Consider using solar panels.',),
            ('Maintain your HVAC system regularly.',),
            ('Use power strips to turn off multiple devices.',),
            ('Wash clothes in cold water.',)
        ]

        # Insert the energy tips into the table
        cursor.executemany('INSERT INTO energy_tips (tip) VALUES (?)', energy_tips)

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

# Run the function to create the database and table
if __name__ == "__main__":
    initialize_database()
    print("Database and table created, and initial tips inserted if the table was empty.")
