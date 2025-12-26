from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import models

def update_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TABLE routines ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            connection.commit()
            print("Added created_at column to routines table.")
        except Exception as e:
            print(f"Column might already exist: {e}")

if __name__ == "__main__":
    update_schema()
