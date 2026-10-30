# School Database Design

## Table Overview
* **`students`**: Stores biographical and contact information for each student enrolled in the institution. The `email` column enforces a `UNIQUE` constraint to ensure no two students share the same email address.
* **`courses`**: Maintains the catalog of available subjects offered by the school, identified by a unique course code and title.
* **`enrolments`**: Acts as a junction (join) table connecting students to courses. It also holds attribute data specific to that relationship, namely the student's `grade`.

---

## Relationships & The Join Table
* **One-to-Many Relationships**:
  * A single `student` can have multiple `enrolments`, but each individual enrolment record belongs to exactly one student.
  * A single `course` can have multiple `enrolments`, but each individual enrolment record belongs to exactly one course.
* **Many-to-Many Relationship & The Join Table**:
  Students and courses share a many-to-many relationship—one student can take many courses, and one course can have many students. In a relational database, many-to-many relationships cannot be represented directly with simple columns, so an intermediate **join table (`enrolments`)** is required. This table breaks down the many-to-many association into two clean one-to-many relationships while providing a natural home for relationship-specific data like grades and composite unique constraints (`UNIQUE(student_id, course_id)`).

---

## Recommended Index
```sql
CREATE INDEX idx_enrolments_student ON enrolments(student_id);

Reason: In a school management system, frequent queries search for all courses or grades associated with a specific student. Adding an index on student_id in the enrolments table significantly speeds up lookups and joins involving student records without requiring a full table scan.

SQL vs. NoSQL Justification
For a school database managing students, courses, grades, and academic records, SQL (Relational Database) is the ideal choice. Academic data is highly structured, interconnected, and strictly governed by relational constraints (such as ensuring that grades always link to valid students and active courses). SQL databases provide ACID compliance, ensuring that transaction updates—like modifying grades or processing enrolments—are atomic and reliable. Furthermore, relational databases excel at performing complex aggregations and multi-table joins (such as counting students per course or filtering un-enrolled students), which would be much harder to maintain and query efficiently in a document-based NoSQL store.


---
