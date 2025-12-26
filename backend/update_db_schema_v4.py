from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import models

def update_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TABLE routines ADD COLUMN current_streak INTEGER DEFAULT 0"))
            connection.execute(text("ALTER TABLE routines ADD COLUMN longest_streak INTEGER DEFAULT 0"))
            connection.execute(text("ALTER TABLE routines ADD COLUMN last_streak INTEGER DEFAULT 0"))
            connection.execute(text("ALTER TABLE routines ADD COLUMN last_completed_date TIMESTAMP"))
            connection.commit()
            print("Added streak columns to routines table.")
        except Exception as e:
            print(f"Columns might already exist: {e}")

if __name__ == "__main__":
    update_schema()
