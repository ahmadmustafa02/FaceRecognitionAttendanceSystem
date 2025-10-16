import sqlite3
import numpy as np

# Function to add a new employee with their face embedding
def add_employee(name, face_embedding):
    conn = sqlite3.connect('attendance.db')
    cursor = conn.cursor()

    # Convert embedding to BLOB
    face_embedding_blob = face_embedding.tobytes()

    cursor.execute('''
        INSERT INTO employees (name, face_embedding)
        VALUES (?, ?)
    ''', (name, face_embedding_blob))

    employee_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return employee_id


# Function to get all employee embeddings from the database
def get_all_employee_embeddings():
    conn = sqlite3.connect('attendance.db')
    cursor = conn.cursor()

    cursor.execute('SELECT id, name, face_embedding FROM employees')
    rows = cursor.fetchall()

    # Convert embeddings from BLOB to numpy arrays
    employees = [(row[0], row[1], np.frombuffer(row[2], dtype=np.float32)) for row in rows]

    conn.close()
    return employees


# Function to mark attendance for an employee
def mark_attendance(employee_id):
    conn = sqlite3.connect('attendance.db')
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO attendance (employee_id)
        VALUES (?)
    ''', (employee_id,))

    conn.commit()
    conn.close()


# Function to get attendance records by employee name
def get_attendance_by_name(name):
    conn = sqlite3.connect('attendance.db')
    cursor = conn.cursor()

    cursor.execute('''
        SELECT a.timestamp
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE e.name = ?
        ORDER BY a.timestamp DESC
    ''', (name,))

    attendance_records = cursor.fetchall()
    conn.close()
    return attendance_records


# Function to fetch attendance details for a specific employee based on employee ID
def get_attendance_by_emp_id(emp_id):
    conn = sqlite3.connect('attendance.db')
    cursor = conn.cursor()

    query = '''
        SELECT attendance.id, employees.name, attendance.timestamp
        FROM attendance
        JOIN employees ON attendance.employee_id = employees.id
        WHERE employees.id = ?
        ORDER BY attendance.timestamp DESC
    '''

    cursor.execute(query, (emp_id,))
    records = cursor.fetchall()
    conn.close()
    return records