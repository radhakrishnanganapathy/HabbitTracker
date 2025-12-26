from sqlalchemy.orm import Session
import models, schemas
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        email=user.email, 
        username=user.username, 
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_routine(db: Session, routine: schemas.RoutineCreate, user_id: int):
    # Create Routine
    db_routine = models.Routine(
        name=routine.name,
        routine_type=routine.routine_type,
        order_index=routine.order_index,
        description=routine.description,
        user_id=user_id
    )
    db.add(db_routine)
    db.commit()
    db.refresh(db_routine)
    
    # Create Tasks
    for task in routine.tasks:
        task_data = task.dict(exclude={'id'}) # Exclude ID for creation
        db_task = models.RoutineTask(**task_data, routine_id=db_routine.id)
        db.add(db_task)
    
    db.commit()
    db.refresh(db_routine)
    return db_routine

def create_goal(db: Session, goal: schemas.GoalCreate, user_id: int):
    db_goal = models.Goal(**goal.dict(), user_id=user_id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def get_goals(db: Session, user_id: int):
    return db.query(models.Goal).filter(models.Goal.user_id == user_id).all()

def update_goal(db: Session, goal_id: int, goal_update: schemas.GoalUpdate):
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not db_goal:
        return None
    
    update_data = goal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_goal, key, value)
    
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def delete_goal(db: Session, goal_id: int):
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not db_goal:
        return None
    db.delete(db_goal)
    db.commit()
    return db_goal

def get_routines(db: Session, user_id: int):
    return db.query(models.Routine).filter(models.Routine.user_id == user_id).all()

def create_task_log(db: Session, task_id: int, date, status: str = "completed"):
    # Check if already exists
    existing = db.query(models.TaskLog).filter(models.TaskLog.task_id == task_id, models.TaskLog.date == date).first()
    if existing:
        existing.status = status
        db.commit()
        db.refresh(existing)
        # We might need to re-evaluate streak if status changed, but let's assume it's fine for now or handle below
    else:
        db_log = models.TaskLog(task_id=task_id, date=date, status=status)
        db.add(db_log)
        db.commit()
        db.refresh(db_log)

    # Streak Logic
    # 1. Get the routine for this task
    task = db.query(models.RoutineTask).filter(models.RoutineTask.id == task_id).first()
    if not task:
        return db_log if 'db_log' in locals() else existing

    routine = db.query(models.Routine).filter(models.Routine.id == task.routine_id).first()
    if not routine:
        return db_log if 'db_log' in locals() else existing

    # 2. Check if all tasks in this routine are completed for this date
    # Get all task IDs for this routine
    routine_task_ids = [t.id for t in routine.tasks]
    total_tasks = len(routine_task_ids)
    
    # Get count of completed tasks for this routine on this date
    completed_count = db.query(models.TaskLog).filter(
        models.TaskLog.task_id.in_(routine_task_ids),
        models.TaskLog.date == date,
        models.TaskLog.status == "completed"
    ).count()

    if completed_count == total_tasks:
        # Routine Completed!
        # Check if we already updated streak for today
        # We can check last_completed_date. 
        # Note: 'date' passed here is usually datetime at midnight.
        
        # If last_completed_date is None, this is the first time.
        # If last_completed_date == date, we already counted this day.
        # If last_completed_date == date - 1 day, increment streak.
        # If last_completed_date < date - 1 day, streak broken (but we might have reset it on read? No, let's handle here).
        
        from datetime import timedelta
        
        if routine.last_completed_date == date:
            pass # Already counted
        elif routine.last_completed_date == date - timedelta(days=1):
            routine.current_streak += 1
            routine.last_completed_date = date
        else:
            # Broken streak or new streak
            # If it was broken, save last streak
            if routine.current_streak > 0:
                routine.last_streak = routine.current_streak
            
            routine.current_streak = 1
            routine.last_completed_date = date
        
        # Update longest
        if routine.current_streak > routine.longest_streak:
            routine.longest_streak = routine.current_streak
            
        db.commit()
        db.refresh(routine)

    return db_log if 'db_log' in locals() else existing

def delete_task_log(db: Session, task_id: int, date):
    db_log = db.query(models.TaskLog).filter(models.TaskLog.task_id == task_id, models.TaskLog.date == date).first()
    if db_log:
        # Get routine info to update streak if necessary
        task = db.query(models.RoutineTask).filter(models.RoutineTask.id == task_id).first()
        routine = None
        if task:
            routine = db.query(models.Routine).filter(models.Routine.id == task.routine_id).first()

        db.delete(db_log)
        db.commit()
        
        # Check if we need to revert streak
        # If the routine was marked as completed on this date, removing a task means it's no longer completed.
        if routine and routine.last_completed_date == date:
            # If we are about to reduce the current streak, check if we need to reduce longest_streak too.
            # This happens if the current streak WAS the longest streak (or equal to it).
            # Specifically, if current_streak == longest_streak, and we reduce current, 
            # then longest should probably also be reduced IF this streak was the one setting the record.
            # However, we can't easily know if there was *another* previous streak of the same length.
            # But for the specific case the user mentioned (new routine, streak 0->1->0), 
            # if current == longest, we should decrement both.
            
            if routine.current_streak > 0:
                if routine.current_streak == routine.longest_streak:
                    routine.longest_streak -= 1
                routine.current_streak -= 1
            
            # Revert last_completed_date to the previous day
            # Assuming a valid streak meant the previous day was completed.
            from datetime import timedelta
            routine.last_completed_date = date - timedelta(days=1)
            
            db.add(routine)
            db.commit()
            
        return True
    return False

def get_today_task_logs(db: Session, user_id: int, date):
    # Join routines to filter by user_id
    return db.query(models.TaskLog).join(models.RoutineTask).join(models.Routine).filter(
        models.Routine.user_id == user_id,
        models.TaskLog.date == date
    ).all()

def update_routine(db: Session, routine_id: int, routine_update: schemas.RoutineCreate):
    db_routine = db.query(models.Routine).filter(models.Routine.id == routine_id).first()
    if not db_routine:
        return None
    
    # Update basic fields
    db_routine.name = routine_update.name
    db_routine.routine_type = routine_update.routine_type
    db_routine.description = routine_update.description
    
    # Update tasks intelligently
    # 1. Get existing tasks map
    existing_tasks_map = {task.id: task for task in db_routine.tasks}
    
    # 2. Process incoming tasks
    incoming_task_ids = []
    
    for task_data in routine_update.tasks:
        if task_data.id and task_data.id in existing_tasks_map:
            # Update existing task
            existing_task = existing_tasks_map[task_data.id]
            existing_task.name = task_data.name
            existing_task.time = task_data.time
            existing_task.description = task_data.description
            incoming_task_ids.append(task_data.id)
        else:
            # Create new task
            new_task = models.RoutineTask(
                name=task_data.name,
                time=task_data.time,
                description=task_data.description,
                routine_id=routine_id
            )
            db.add(new_task)
            
    # 3. Delete tasks that are not in the incoming list
    for task_id, existing_task in existing_tasks_map.items():
        if task_id not in incoming_task_ids:
            db.delete(existing_task)
    
    db.commit()
    db.refresh(db_routine)
    return db_routine

def get_routine_completion_history(db: Session, routine_id: int):
    # We need to find all dates where *all* tasks of the routine were completed.
    routine = db.query(models.Routine).filter(models.Routine.id == routine_id).first()
    if not routine:
        return []
    
    tasks = routine.tasks
    if not tasks:
        return []
    
    task_ids = [t.id for t in tasks]
    total_tasks = len(task_ids)
    
    # Query to group by date and count completed tasks
    # We want dates where count(distinct task_id) == total_tasks
    
    from sqlalchemy import func
    
    results = db.query(
        models.TaskLog.date,
        func.count(models.TaskLog.task_id)
    ).filter(
        models.TaskLog.task_id.in_(task_ids),
        models.TaskLog.status == 'completed'
    ).group_by(
        models.TaskLog.date
    ).all()
    
    completed_dates = []
    for date, count in results:
        if count >= total_tasks:
            completed_dates.append(date)
            
    return completed_dates

def delete_routine(db: Session, routine_id: int):
    db_routine = db.query(models.Routine).filter(models.Routine.id == routine_id).first()
    if not db_routine:
        return None
    db.delete(db_routine)
    db.commit()
    return db_routine

def get_routine_task_logs(db: Session, routine_id: int):
    routine = db.query(models.Routine).filter(models.Routine.id == routine_id).first()
    if not routine:
        return []
    
    task_ids = [t.id for t in routine.tasks]
    
    return db.query(models.TaskLog).filter(
        models.TaskLog.task_id.in_(task_ids)
    ).all()

def create_todo(db: Session, todo: schemas.TodoCreate, user_id: int):
    db_todo = models.Todo(**todo.dict(), user_id=user_id)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

def get_todos(db: Session, user_id: int):
    return db.query(models.Todo).filter(models.Todo.user_id == user_id).all()

def update_todo(db: Session, todo_id: int, todo_update: schemas.TodoUpdate):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if not db_todo:
        return None
    
    update_data = todo_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)
    
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

def delete_todo(db: Session, todo_id: int):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if not db_todo:
        return None
    db.delete(db_todo)
    db.commit()
    return db_todo

from sqlalchemy import extract, func, cast, Date

def get_todo_stats(db: Session, user_id: int, filter_type: str, date_from=None, date_to=None, specific_date=None, month=None, year=None):
    query = db.query(models.Todo).filter(models.Todo.user_id == user_id)
    
    if filter_type == 'today':
        today = datetime.now().date()
        query = query.filter(cast(models.Todo.due_date, Date) == today)
    elif filter_type == 'date':
        if specific_date:
            query = query.filter(cast(models.Todo.due_date, Date) == specific_date)
    elif filter_type == 'range':
        if date_from and date_to:
            query = query.filter(cast(models.Todo.due_date, Date) >= date_from, cast(models.Todo.due_date, Date) <= date_to)
    elif filter_type == 'month':
        if month and year:
            query = query.filter(extract('month', models.Todo.due_date) == month, extract('year', models.Todo.due_date) == year)
    elif filter_type == 'year':
        if year:
            query = query.filter(extract('year', models.Todo.due_date) == year)
            
    todos = query.all()
    
    total = len(todos)
    completed = len([t for t in todos if t.status == 'completed'])
    skipped = len([t for t in todos if t.status == 'skipped'])
    pending = len([t for t in todos if t.status == 'pending'])
    
    return {
        "total": total,
        "completed": completed,
        "skipped": skipped,
        "pending": pending
    }

def create_bucket_list(db: Session, bucket_list: schemas.BucketListCreate, user_id: int):
    db_bucket_list = models.BucketList(**bucket_list.dict(), user_id=user_id)
    db.add(db_bucket_list)
    db.commit()
    db.refresh(db_bucket_list)
    return db_bucket_list

def get_bucket_lists(db: Session, user_id: int):
    return db.query(models.BucketList).filter(models.BucketList.user_id == user_id).all()

def update_bucket_list(db: Session, bucket_list_id: int, bucket_list_update: schemas.BucketListUpdate):
    db_bucket_list = db.query(models.BucketList).filter(models.BucketList.id == bucket_list_id).first()
    if not db_bucket_list:
        return None
    
    update_data = bucket_list_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_bucket_list, key, value)
    
    db.add(db_bucket_list)
    db.commit()
    db.refresh(db_bucket_list)
    return db_bucket_list

def delete_bucket_list(db: Session, bucket_list_id: int):
    db_bucket_list = db.query(models.BucketList).filter(models.BucketList.id == bucket_list_id).first()
    if not db_bucket_list:
        return None
    db.delete(db_bucket_list)
    db.commit()
    return db_bucket_list

def get_bucket_list_stats(db: Session, user_id: int):
    bucket_lists = db.query(models.BucketList).filter(models.BucketList.user_id == user_id).all()
    
    total = len(bucket_lists)
    completed = len([b for b in bucket_lists if b.status == 'completed'])
    skipped = len([b for b in bucket_lists if b.status == 'skipped'])
    waiting = len([b for b in bucket_lists if b.status == 'waiting'])
    
    return {
        "total": total,
        "completed": completed,
        "skipped": skipped,
        "waiting": waiting
    }
