-- Use the mydb database
USE sql8754029;


-- Create Sales_Department table
CREATE TABLE Sales_Department (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Create Sales_Representative table
CREATE TABLE Sales_Representative (
    sales_rep_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    hire_date DATE,
    region VARCHAR(100),  -- Ethiopian regions
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    salary DECIMAL(10, 2),
    commission_rate DECIMAL(5, 2),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES Sales_Department(department_id)
);

-- Insert sample data into Sales_Department table
INSERT INTO Sales_Department (department_name, description) VALUES
('Domestic Sales', 'Handles sales within Ethiopia for wire and cables.'),
('Export Sales', 'Manages export operations of wire and cables.'),
('Corporate Accounts', 'Focuses on large corporate clients and contracts.'),
('Technical Support', 'Provides technical assistance and support for clients.'),
('Regional Sales North', 'Manages sales operations in northern regions of Ethiopia.'),
('Regional Sales South', 'Handles sales operations in southern regions of Ethiopia.');

-- Insert sample data into Sales_Representative table
INSERT INTO Sales_Representative (first_name, last_name, email, phone_number, hire_date, region, status, salary, commission_rate, department_id) VALUES
('Abebe', 'Kebede', 'abebe.kebede@example.com', '091-123-4567', '2022-01-10', 'Addis Ababa', 'active', 60000.00, 5.00, 1),
('Marta', 'Tadesse', 'marta.tadesse@example.com', '091-234-5678', '2021-06-15', 'Gondar', 'active', 55000.00, 4.75, 5),
('Solomon', 'Tesfaye', 'solomon.tesfaye@example.com', '091-345-6789', '2020-08-20', 'Mekelle', 'inactive', 70000.00, 6.00, 2),
('Hana', 'Abraham', 'hana.abraham@example.com', '091-456-7890', '2022-03-25', 'Addis Ababa', 'active', 62000.00, 5.25, 3),
('Jemal', 'Mohammed', 'jemal.mohammed@example.com', '091-567-8901', '2023-01-05', 'Bahir Dar', 'active', 58000.00, 4.50, 4),
('Mulu', 'Sisay', 'mulu.sisay@example.com', '091-678-9012', '2021-11-10', 'Hawassa', 'on_leave', 59000.00, 4.75, 6);
