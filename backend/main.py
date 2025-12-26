from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import crud, models, schemas
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Routine Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/", tags=["General"])
def read_root():
    return {"message": "Welcome to Routine Tracker API"}

@app.post("/users/", response_model=schemas.User, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/{user_id}", response_model=schemas.User, tags=["Users"])
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.put("/users/{user_id}", response_model=schemas.User, tags=["Users"])
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = crud.update_user(db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.post("/users/{user_id}/routines/", response_model=schemas.Routine, tags=["Routines"])
def create_routine_for_user(
    user_id: int, routine: schemas.RoutineCreate, db: Session = Depends(get_db)
):
    return crud.create_routine(db=db, routine=routine, user_id=user_id)

    return crud.create_routine(db=db, routine=routine, user_id=user_id)

@app.get("/users/{user_id}/routines/", response_model=list[schemas.Routine], tags=["Routines"])
def read_routines(user_id: int, db: Session = Depends(get_db)):
    return crud.get_routines(db=db, user_id=user_id)

@app.put("/routines/{routine_id}", response_model=schemas.Routine, tags=["Routines"])
def update_routine(routine_id: int, routine: schemas.RoutineCreate, db: Session = Depends(get_db)):
    db_routine = crud.update_routine(db, routine_id=routine_id, routine_update=routine)
    if db_routine is None:
        raise HTTPException(status_code=404, detail="Routine not found")
    return db_routine

@app.delete("/routines/{routine_id}", response_model=schemas.Routine, tags=["Routines"])
def delete_routine(routine_id: int, db: Session = Depends(get_db)):
    db_routine = crud.delete_routine(db, routine_id=routine_id)
    if db_routine is None:
        raise HTTPException(status_code=404, detail="Routine not found")
    return db_routine

from datetime import datetime, date

from typing import Optional

@app.get("/routines/{routine_id}/history", response_model=list[datetime], tags=["Routines"])
def get_routine_history(routine_id: int, db: Session = Depends(get_db)):
    return crud.get_routine_completion_history(db, routine_id=routine_id)

@app.get("/routines/{routine_id}/logs", response_model=list[schemas.TaskLog], tags=["Routines"])
def get_routine_logs(routine_id: int, db: Session = Depends(get_db)):
    return crud.get_routine_task_logs(db, routine_id=routine_id)

@app.post("/tasks/{task_id}/complete", response_model=schemas.TaskLog, tags=["Tasks"])
def complete_task(task_id: int, status: str = "completed", date_str: Optional[str] = None, db: Session = Depends(get_db)):
    if date_str:
        try:
            log_date = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        today = date.today()
        log_date = datetime.combine(today, datetime.min.time())
        
    return crud.create_task_log(db=db, task_id=task_id, date=log_date, status=status)

@app.delete("/tasks/{task_id}/complete", tags=["Tasks"])
def uncomplete_task(task_id: int, date_str: Optional[str] = None, db: Session = Depends(get_db)):
    if date_str:
        try:
            log_date = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        today = date.today()
        log_date = datetime.combine(today, datetime.min.time())
        
    success = crud.delete_task_log(db=db, task_id=task_id, date=log_date)
    if not success:
        raise HTTPException(status_code=404, detail="Task log not found")
    return {"status": "success"}

@app.get("/users/{user_id}/tasks/today", response_model=list[schemas.TaskLog], tags=["Tasks"])
def read_today_task_logs(user_id: int, db: Session = Depends(get_db)):
    today = date.today()
    log_date = datetime.combine(today, datetime.min.time())
    return crud.get_today_task_logs(db=db, user_id=user_id, date=log_date)

@app.post("/users/{user_id}/goals/", response_model=schemas.Goal, tags=["Goals"])
def create_goal_for_user(
    user_id: int, goal: schemas.GoalCreate, db: Session = Depends(get_db)
):
    return crud.create_goal(db=db, goal=goal, user_id=user_id)

@app.get("/users/{user_id}/goals/", response_model=list[schemas.Goal], tags=["Goals"])
def read_goals(user_id: int, db: Session = Depends(get_db)):
    return crud.get_goals(db=db, user_id=user_id)

@app.put("/goals/{goal_id}", response_model=schemas.Goal, tags=["Goals"])
def update_goal(goal_id: int, goal_update: schemas.GoalUpdate, db: Session = Depends(get_db)):
    db_goal = crud.update_goal(db, goal_id=goal_id, goal_update=goal_update)
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return db_goal

@app.delete("/goals/{goal_id}", response_model=schemas.Goal, tags=["Goals"])
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    db_goal = crud.delete_goal(db, goal_id=goal_id)
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return db_goal

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
import auth

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/token", tags=["Auth"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username) # Using email as username for login
    if not user:
        # Try username if email fails
        user = db.query(models.User).filter(models.User.username == form_data.username).first()
        
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "full_name": user.full_name}

from fastapi.staticfiles import StaticFiles
from fastapi import UploadFile, File
import shutil
import uuid

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/upload", tags=["Upload"])
async def upload_image(file: UploadFile = File(...)):
    file_extension = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"static/images/{file_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8002/{file_path}"}

@app.post("/users/{user_id}/todos/", response_model=schemas.Todo, tags=["Todos"])
def create_todo_for_user(
    user_id: int, todo: schemas.TodoCreate, db: Session = Depends(get_db)
):
    return crud.create_todo(db=db, todo=todo, user_id=user_id)

@app.get("/users/{user_id}/todos/", response_model=list[schemas.Todo], tags=["Todos"])
def read_todos(user_id: int, db: Session = Depends(get_db)):
    return crud.get_todos(db=db, user_id=user_id)

@app.put("/todos/{todo_id}", response_model=schemas.Todo, tags=["Todos"])
def update_todo(todo_id: int, todo_update: schemas.TodoUpdate, db: Session = Depends(get_db)):
    db_todo = crud.update_todo(db, todo_id=todo_id, todo_update=todo_update)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo

@app.delete("/todos/{todo_id}", response_model=schemas.Todo, tags=["Todos"])
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = crud.delete_todo(db, todo_id=todo_id)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo

@app.get("/users/{user_id}/todos/stats", response_model=schemas.TodoStats, tags=["Todos"])
def get_todo_stats(
    user_id: int, 
    filter_type: str, 
    date_from: Optional[str] = None, 
    date_to: Optional[str] = None, 
    specific_date: Optional[str] = None, 
    month: Optional[int] = None, 
    year: Optional[int] = None, 
    db: Session = Depends(get_db)
):
    # Parse dates if provided
    p_date_from = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    p_date_to = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    p_specific_date = datetime.strptime(specific_date, "%Y-%m-%d").date() if specific_date else None
    
    return crud.get_todo_stats(
        db=db, 
        user_id=user_id, 
        filter_type=filter_type, 
        date_from=p_date_from, 
        date_to=p_date_to, 
        specific_date=p_specific_date, 
        month=month, 
        year=year
    )

@app.post("/users/{user_id}/bucketlists/", response_model=schemas.BucketList, tags=["BucketLists"])
def create_bucket_list(
    user_id: int, bucket_list: schemas.BucketListCreate, db: Session = Depends(get_db)
):
    return crud.create_bucket_list(db=db, bucket_list=bucket_list, user_id=user_id)

@app.get("/users/{user_id}/bucketlists/", response_model=list[schemas.BucketList], tags=["BucketLists"])
def read_bucket_lists(user_id: int, db: Session = Depends(get_db)):
    return crud.get_bucket_lists(db=db, user_id=user_id)

@app.put("/bucketlists/{bucket_list_id}", response_model=schemas.BucketList, tags=["BucketLists"])
def update_bucket_list(bucket_list_id: int, bucket_list_update: schemas.BucketListUpdate, db: Session = Depends(get_db)):
    db_bucket_list = crud.update_bucket_list(db, bucket_list_id=bucket_list_id, bucket_list_update=bucket_list_update)
    if db_bucket_list is None:
        raise HTTPException(status_code=404, detail="BucketList not found")
    return db_bucket_list

@app.delete("/bucketlists/{bucket_list_id}", response_model=schemas.BucketList, tags=["BucketLists"])
def delete_bucket_list(bucket_list_id: int, db: Session = Depends(get_db)):
    db_bucket_list = crud.delete_bucket_list(db, bucket_list_id=bucket_list_id)
    if db_bucket_list is None:
        raise HTTPException(status_code=404, detail="BucketList not found")
    return db_bucket_list

@app.get("/users/{user_id}/bucketlists/stats", response_model=schemas.BucketListStats, tags=["BucketLists"])
def get_bucket_list_stats(user_id: int, db: Session = Depends(get_db)):
    return crud.get_bucket_list_stats(db=db, user_id=user_id)
