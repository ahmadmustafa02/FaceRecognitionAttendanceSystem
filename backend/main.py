from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import Optional

from services.face_recognition import register_employee, recognize_and_mark_attendance
from database.db_operations import get_attendance_by_name, get_all_employee_embeddings

app = FastAPI(title="Face Recognition Attendance API")

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your React Native app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Face Recognition Attendance API", "status": "running"}

@app.post("/api/register")
async def register_face(
    name: str = Form(...),
    image: UploadFile = File(...)
):
    """Register a new employee with face image"""
    try:
        # Read and decode image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Register employee
        result = register_employee(name, img)
        
        if result:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": f"Employee '{name}' registered successfully!",
                    "employee_id": result
                }
            )
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Registration failed. Liveness check failed or no face detected."
                }
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mark-attendance")
async def mark_attendance(image: UploadFile = File(...)):
    """Mark attendance for a registered employee"""
    try:
        # Read and decode image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Recognize and mark attendance
        result = recognize_and_mark_attendance(img)
        
        if result:
            name, emp_id = result
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": f"Attendance marked for {name}",
                    "employee_name": name,
                    "employee_id": emp_id
                }
            )
        else:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "No match found or liveness check failed"
                }
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/attendance/{name}")
async def get_attendance(name: str):
    """Get attendance records for an employee by name"""
    try:
        records = get_attendance_by_name(name)
        
        attendance_list = [
            {"timestamp": record[0]} for record in records
        ]
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "employee_name": name,
                "attendance_count": len(attendance_list),
                "records": attendance_list
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/employees")
async def get_employees():
    """Get all registered employees"""
    try:
        employees = get_all_employee_embeddings()
        
        employee_list = [
            {"id": emp[0], "name": emp[1]} for emp in employees
        ]
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "count": len(employee_list),
                "employees": employee_list
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)