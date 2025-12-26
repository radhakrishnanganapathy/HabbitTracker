from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    dob = Column(DateTime, nullable=True)
    hobby = Column(String, nullable=True)
    positive_traits = Column(Text, nullable=True)
    negative_traits = Column(Text, nullable=True)
    profile_image = Column(String, nullable=True)
    
    routines = relationship("Routine", back_populates="user")
    habits = relationship("Habit", back_populates="user")
    skills = relationship("Skill", back_populates="user")
    journal_entries = relationship("JournalEntry", back_populates="user")
    tasks = relationship("Task", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    todos = relationship("Todo", back_populates="user")
    bucket_lists = relationship("BucketList", back_populates="user")

class Routine(Base):
    __tablename__ = "routines"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String) # e.g., "Wakeup", "Brush"
    routine_type = Column(String, default="All Days") # "Weekday", "Weekend", "All Days"
    order_index = Column(Integer) # 1, 2, 3...
    description = Column(String, nullable=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_streak = Column(Integer, default=0)
    last_completed_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="routines")
    logs = relationship("RoutineLog", back_populates="routine")
    tasks = relationship("RoutineTask", back_populates="routine", cascade="all, delete-orphan")

class RoutineTask(Base):
    __tablename__ = "routine_tasks"
    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"))
    name = Column(String) # e.g., "Wake up", "Brush"
    time = Column(String) # e.g., "05:30", "06:00"
    description = Column(String, nullable=True)
    
    routine = relationship("Routine", back_populates="tasks")
    logs = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")

class TaskLog(Base):
    __tablename__ = "task_logs"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("routine_tasks.id"))
    completed_at = Column(DateTime, default=datetime.utcnow)
    date = Column(DateTime) # Store just the date part effectively
    status = Column(String, default="completed") # "completed", "skipped"
    
    task = relationship("RoutineTask", back_populates="logs")

class RoutineLog(Base):
    __tablename__ = "routine_logs"
    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"))
    completed_at = Column(DateTime, default=datetime.utcnow)
    date = Column(DateTime) # Store just the date part effectively
    
    routine = relationship("Routine", back_populates="logs")

class Habit(Base):
    __tablename__ = "habits"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    description = Column(String, nullable=True)
    streak = Column(Integer, default=0)
    
    user = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit")

class HabitLog(Base):
    __tablename__ = "habit_logs"
    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"))
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    habit = relationship("Habit", back_populates="logs")

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    target_hours = Column(Integer)
    current_minutes = Column(Integer, default=0)
    
    user = relationship("User", back_populates="skills")
    logs = relationship("SkillLog", back_populates="skill")

class SkillLog(Base):
    __tablename__ = "skill_logs"
    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"))
    minutes_spent = Column(Integer)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    skill = relationship("Skill", back_populates="logs")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    mood = Column(Integer) # 1-10
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="journal_entries")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    is_completed = Column(Boolean, default=False)
    scheduled_for = Column(DateTime) # Date for the task
    
    user = relationship("User", back_populates="tasks")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    goal_type = Column(String) # "Long Term", "Short Term"
    name = Column(String)
    duration_type = Column(String) # "Days", "Months", "Years"
    duration_value = Column(Integer)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    agenda = Column(Text)
    status = Column(String, default="Active") # "Active", "Done", "Drop"
    
    user = relationship("User", back_populates="goals")

class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime)
    grace_period = Column(DateTime, nullable=True)
    status = Column(String, default="pending") # "pending", "completed", "cancelled"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="todos")

class BucketList(Base):
    __tablename__ = "bucket_lists"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    description = Column(Text, nullable=True)
    expected_date = Column(DateTime)
    created_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="waiting") # "waiting", "completed", "skipped"
    
    user = relationship("User", back_populates="bucket_lists")
