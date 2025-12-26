from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def add_column(engine, table_name, column_name, column_type):
    with engine.begin() as conn:
        try:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
            print(f"Added column {column_name} to {table_name}")
        except Exception as e:
            print(f"Column {column_name} might already exist or error: {e}")
            # In case of transaction error, we might need to rollback if not autocommit
            # But for DDL in postgres, it usually works or fails.

if __name__ == "__main__":
    add_column(engine, "users", "dob", "TIMESTAMP")
    add_column(engine, "users", "hobby", "VARCHAR")
    add_column(engine, "users", "positive_traits", "TEXT")
    add_column(engine, "users", "negative_traits", "TEXT")
    add_column(engine, "users", "profile_image", "VARCHAR")
