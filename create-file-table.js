import pg from 'pg';
const {Pool} = pg;
const p = new Pool({connectionString: "postgresql://viraj:XoUeuB7yX041ya_Li9qbkQ@vexing-fowl-23755.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"});
p.query('CREATE TABLE IF NOT EXISTS file_storage (key VARCHAR(255) PRIMARY KEY, file_data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)').then(()=> {console.log("Database table successfully added"); process.exit(0);});
