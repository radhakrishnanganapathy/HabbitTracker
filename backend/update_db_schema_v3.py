from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import models

def update_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as connection:
        # Add status column to task_logs table if it doesn't exist
        try:
            connection.execute(text("ALTER TABLE task_logs ADD COLUMN status VARCHAR DEFAULT 'completed'"))
            connection.commit()
            print("Added status column to task_logs table.")
        except Exception as e:
            print(f"Column status might already exist: {e}")

if __name__ == "__main__":
    update_schema()
