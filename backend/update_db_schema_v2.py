from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL
import models

def update_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # We can try to create the table if it doesn't exist using metadata
    # But since we are using raw SQL for updates usually, let's stick to that or use create_all for new tables
    # create_all will only create tables that don't exist.
    models.Base.metadata.create_all(bind=engine)
    print("Updated schema: Created missing tables (task_logs).")

if __name__ == "__main__":
    update_schema()
