import streamlit as st
import cv2
import numpy as np
from PIL import Image
from services.face_recognition import register_employee, recognize_and_mark_attendance

st.set_page_config(page_title="Face Recognition Attendance", layout="wide")

st.title("👤 Face Recognition Attendance System")

# Create tabs
tab1, tab2 = st.tabs(["Register Employee", "Mark Attendance"])

with tab1:
    st.header("Register New Employee")
    
    col1, col2 = st.columns(2)
    
    with col1:
        name = st.text_input("Employee Name", placeholder="Enter employee name")
        
        # Option to choose between upload or webcam
        upload_option = st.radio("Choose input method:", ["Upload Image", "Use Webcam"])
        
        if upload_option == "Upload Image":
            uploaded_file = st.file_uploader("Upload Face Image", type=['jpg', 'jpeg', 'png'])
            if uploaded_file is not None:
                image = Image.open(uploaded_file)
                st.image(image, caption="Uploaded Image", use_column_width=True)
        else:
            camera_image = st.camera_input("Take a picture")
            if camera_image is not None:
                image = Image.open(camera_image)
                st.image(image, caption="Captured Image", use_column_width=True)
        
        if st.button("Register Employee", type="primary"):
            if not name or name.strip() == "":
                st.error("Please enter employee name")
            elif upload_option == "Upload Image" and uploaded_file is None:
                st.error("Please upload an image")
            elif upload_option == "Use Webcam" and camera_image is None:
                st.error("Please capture an image")
            else:
                try:
                    # Get the image based on selection
                    if upload_option == "Upload Image":
                        img = Image.open(uploaded_file)
                    else:
                        img = Image.open(camera_image)
                    
                    # Convert PIL image to OpenCV format
                    img_array = np.array(img)
                    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                    
                    # Register employee
                    with st.spinner("Registering employee..."):
                        result = register_employee(name, img_bgr)
                    
                    if result:
                        st.success(f"✅ Employee '{name}' registered successfully! (ID: {result})")
                    else:
                        st.error("❌ Registration failed. Please ensure your face is clearly visible and try again.")
                except Exception as e:
                    st.error(f"Error: {str(e)}")

with tab2:
    st.header("Mark Attendance")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Option to choose between upload or webcam
        attendance_option = st.radio("Choose input method:", ["Upload Image", "Use Webcam"], key="attendance")
        
        if attendance_option == "Upload Image":
            attendance_file = st.file_uploader("Upload Face Image", type=['jpg', 'jpeg', 'png'], key="attendance_upload")
            if attendance_file is not None:
                image = Image.open(attendance_file)
                st.image(image, caption="Uploaded Image", use_column_width=True)
        else:
            attendance_camera = st.camera_input("Take a picture", key="attendance_camera")
            if attendance_camera is not None:
                image = Image.open(attendance_camera)
                st.image(image, caption="Captured Image", use_column_width=True)
        
        if st.button("Mark Attendance", type="primary"):
            if attendance_option == "Upload Image" and attendance_file is None:
                st.error("Please upload an image")
            elif attendance_option == "Use Webcam" and attendance_camera is None:
                st.error("Please capture an image")
            else:
                try:
                    # Get the image based on selection
                    if attendance_option == "Upload Image":
                        img = Image.open(attendance_file)
                    else:
                        img = Image.open(attendance_camera)
                    
                    # Convert PIL image to OpenCV format
                    img_array = np.array(img)
                    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
                    
                    # Recognize and mark attendance
                    with st.spinner("Recognizing face..."):
                        result = recognize_and_mark_attendance(img_bgr)
                    
                    if result:
                        name, emp_id = result
                        st.success(f"✅ Attendance marked for {name} (ID: {emp_id})")
                    else:
                        st.error("❌ No match found or liveness check failed. Please try again.")
                except Exception as e:
                    st.error(f"Error: {str(e)}")

# Sidebar with info
with st.sidebar:
    st.header("ℹ️ Information")
    st.info("""
    **How to use:**
    
    1. **Register Employee**: 
       - Enter name
       - Capture/upload face photo
       - Click Register
    
    2. **Mark Attendance**:
       - Capture/upload face photo
       - Click Mark Attendance
    
    **Tips:**
    - Ensure good lighting
    - Face should be clearly visible
    - Look directly at camera
    """)