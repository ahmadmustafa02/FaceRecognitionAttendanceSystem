import dlib
import cv2
import numpy as np

shape_predictor_path = 'data/shape_predictor_68_face_landmarks.dat'
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor(shape_predictor_path)

def check_liveness(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    if len(faces) == 0:
        return False  # No face detected

    for face in faces:
        shape = predictor(gray, face)
        left_eye_ratio = calculate_eye_aspect_ratio(shape, [36, 37, 38, 39, 40, 41])
        right_eye_ratio = calculate_eye_aspect_ratio(shape, [42, 43, 44, 45, 46, 47])

        if left_eye_ratio < 0.25 and right_eye_ratio < 0.25:
            return True  # Blink detected

    return False

def calculate_eye_aspect_ratio(landmarks, eye_points):
    A = np.linalg.norm(landmarks.part(eye_points[1]).x - landmarks.part(eye_points[5]).x)
    B = np.linalg.norm(landmarks.part(eye_points[2]).x - landmarks.part(eye_points[4]).x)
    C = np.linalg.norm(landmarks.part(eye_points[0]).x - landmarks.part(eye_points[3]).x)
    ear = (A + B) / (2.0 * C)
    return ear
