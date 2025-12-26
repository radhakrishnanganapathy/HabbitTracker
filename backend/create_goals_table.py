from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def create_goals_table(engine):
    with engine.begin() as conn:
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS goals (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    goal_type VARCHAR,
                    name VARCHAR,
                    duration_type VARCHAR,
                    duration_value INTEGER,
                    start_date TIMESTAMP,
                    end_date TIMESTAMP,
                    agenda TEXT,
                    status VARCHAR DEFAULT 'Active'
                );
            """))
            print("Created goals table")
        except Exception as e:
            print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_goals_table(engine)
