from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def update_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as connection:
        # Add routine_type column to routines table if it doesn't exist
        try:
            connection.execute(text("ALTER TABLE routines ADD COLUMN routine_type VARCHAR DEFAULT 'All Days'"))
            connection.commit()
            print("Added routine_type column to routines table.")
        except Exception as e:
            print(f"Column routine_type might already exist: {e}")

        # Create routine_tasks table is handled by create_all in main.py, 
        # but we can also do it here or let the app restart handle it.
        # Since the app is running with reload, it might have already tried to create it if I saved main.py.
        # But let's just rely on the column addition here.

if __name__ == "__main__":
    update_schema()
