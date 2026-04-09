CREATE TABLE IF NOT EXISTS librarians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    library_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    gender VARCHAR(50),
    student_print_id VARCHAR(50) UNIQUE,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    student_print_id VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    total_bw_pages INT,
    total_color_pages INT,
    total_pages INT,
    spiral_binding BOOLEAN DEFAULT false,
    stapling BOOLEAN DEFAULT false,
    service_fee NUMERIC(10, 2),
    subtotal NUMERIC(10, 2),
    total_amount NUMERIC(10, 2),
    payment_status VARCHAR(50),
    print_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT current_timestamp(),
    qr_code TEXT,
    order_type VARCHAR(50) DEFAULT 'standard',
    contact_number VARCHAR(255),
    college VARCHAR(255),
    department VARCHAR(255),
    receiving_date VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS order_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_storage_key VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_extension VARCHAR(10),
    page_count INT,
    print_type VARCHAR(50),
    color_page_ranges VARCHAR(255),
    copies INT DEFAULT 1,
    sides VARCHAR(50) DEFAULT 'single',
    bw_pages INT,
    color_pages INT,
    file_price NUMERIC(10, 2),
    student_note TEXT
);

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(255),
    student_name VARCHAR(255),
    roll_number VARCHAR(50),
    department VARCHAR(255),
    academic_year VARCHAR(50),
    guide_name VARCHAR(255),
    project_title VARCHAR(500),
    document_type VARCHAR(100),
    remarks TEXT,
    file_name VARCHAR(500),
    file_storage_key VARCHAR(500),
    validation_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    type VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE IF NOT EXISTS file_storage (key VARCHAR(255) PRIMARY KEY, file_data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); 
