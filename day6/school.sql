-- Enable foreign key support in SQLite
PRAGMA foreign_keys = ON;

-- Drop existing tables if re-running script
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;

-- 1. Students Table
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- 2. Courses Table
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

-- 3. Enrolments Table (Join Table)
-- UNIQUE constraint prevents a student from enrolling in the same course twice
CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(student_id, course_id)
);

-- --- INSERT SAMPLE DATA ---

-- Insert at least 3 students (+ 1 without enrolments to test LEFT JOIN)
INSERT INTO students (name, email) VALUES
('Alice Smith', 'alice@example.com'),
('Bob Jones', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com'),
('Diana Prince', 'diana@example.com'); -- No enrolments

-- Insert at least 3 courses
INSERT INTO courses (title, code) VALUES
('Mathematics', 'MATH101'),
('Computer Science', 'CS101'),
('Physics', 'PHYS101');

-- Insert at least 5 enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'B+'), -- Alice in Mathematics
(1, 2, 'A'),  -- Alice in Computer Science
(2, 2, 'B'),  -- Bob in Computer Science
(2, 3, 'A-'), -- Bob in Physics
(3, 1, 'C+'); -- Charlie in Mathematics


-- --- FIVE REQUIRED QUERIES ---

-- Query 1: All courses for one student (by name: 'Alice Smith')
SELECT c.title, c.code, e.grade
FROM courses c
JOIN enrolments e ON c.id = e.course_id
JOIN students s ON s.id = e.student_id
WHERE s.name = 'Alice Smith';

-- Query 2: All students on one course (by title: 'Computer Science')
SELECT s.name, s.email, e.grade
FROM students s
JOIN enrolments e ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
WHERE c.title = 'Computer Science';

-- Query 3: The number of students per course
SELECT c.title, c.code, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.id = e.course_id
GROUP BY c.id, c.title, c.code;

-- Query 4: Students who have no enrolments
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON s.id = e.student_id
WHERE e.id IS NULL;

-- Query 5: Update one enrolment's grade (Update Alice's grade in Mathematics to 'A+')
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 1 AND course_id = 1;
