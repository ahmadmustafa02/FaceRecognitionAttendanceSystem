import cv2
import numpy as np
from models.facenet_model import get_face_embedding
from models.liveness_model import check_liveness
from database.db_operations import add_employee, get_all_employee_embeddings, mark_attendance

def register_employee(name, image):
    if not check_liveness(image):
        print("Liveness check failed. Registration not allowed.")
        return False

    face_embedding = get_face_embedding(image)
    if face_embedding is not None:
        employee_id = add_employee(name, face_embedding)
        print(f"Employee {name} registered successfully (ID: {employee_id})")
        return employee_id
    return None

def recognize_and_mark_attendance(image):
    if not check_liveness(image):
        print("Liveness check failed. Access denied.")
        return False

    current_face_embedding = get_face_embedding(image)
    employees = get_all_employee_embeddings()
    threshold = 0.5

    for emp_id, name, stored_embedding in employees:
        similarity = cosine_similarity(current_face_embedding, stored_embedding)
        if similarity > threshold:
            mark_attendance(emp_id)
            print(f"Attendance marked for: {name} (ID: {emp_id})")
            return name, emp_id

    print("No match found. Access denied.")
    return False

def cosine_similarity(embedding1, embedding2):
    dot = embedding1 @ embedding2.T
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    return dot / (norm1 * norm2)
