from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RoutineTaskBase(BaseModel):
    name: str
    time: str
    description: Optional[str] = None

class RoutineTaskCreate(RoutineTaskBase):
    id: Optional[int] = None
    pass

class RoutineTask(RoutineTaskBase):
    id: int
    routine_id: int
    
    class Config:
        from_attributes = True

class TaskLogBase(BaseModel):
    task_id: int
    date: datetime
    status: str = "completed"

class TaskLogCreate(TaskLogBase):
    pass

class TaskLog(TaskLogBase):
    id: int
    completed_at: datetime
    
    class Config:
        from_attributes = True

class RoutineBase(BaseModel):
    name: str
    routine_type: str = "All Days"
    order_index: int
    description: Optional[str] = None

class RoutineCreate(RoutineBase):
    tasks: List[RoutineTaskCreate] = []

class Routine(RoutineBase):
    id: int
    user_id: int
    tasks: List[RoutineTask] = []
    current_streak: int = 0
    longest_streak: int = 0
    last_streak: int = 0
    last_completed_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    dob: Optional[datetime] = None
    hobby: Optional[str] = None
    positive_traits: Optional[str] = None
    negative_traits: Optional[str] = None
    profile_image: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[datetime] = None
    hobby: Optional[str] = None
    positive_traits: Optional[str] = None
    negative_traits: Optional[str] = None
    profile_image: Optional[str] = None

class User(UserBase):
    id: int
    routines: List[Routine] = []
    goals: List['Goal'] = []
    
    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    goal_type: str
    name: str
    duration_type: str
    duration_value: int
    start_date: datetime
    end_date: datetime
    agenda: str
    status: str = "Active"

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    goal_type: Optional[str] = None
    name: Optional[str] = None
    duration_type: Optional[str] = None
    duration_value: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    agenda: Optional[str] = None
    status: Optional[str] = None

class Goal(GoalBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

class TodoBase(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: datetime
    grace_period: Optional[datetime] = None
    status: str = "pending"

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    grace_period: Optional[datetime] = None
    status: Optional[str] = None

class Todo(TodoBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TodoStats(BaseModel):
    total: int
    completed: int
    skipped: int
    pending: int

class BucketListBase(BaseModel):
    name: str
    description: Optional[str] = None
    expected_date: datetime
    status: str = "waiting"

class BucketListCreate(BucketListBase):
    pass

class BucketListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    expected_date: Optional[datetime] = None
    status: Optional[str] = None

class BucketList(BucketListBase):
    id: int
    user_id: int
    created_date: datetime
    
    class Config:
        from_attributes = True

class BucketListStats(BaseModel):
    total: int
    completed: int
    skipped: int
    waiting: int
