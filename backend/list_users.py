from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def list_users():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, username, email FROM users"))
        for row in result:
            print(row)

if __name__ == "__main__":
    list_users()
