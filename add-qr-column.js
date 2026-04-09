import pg from 'pg';
const {Pool} = pg;
const p = new Pool({connectionString: "postgresql://viraj:XoUeuB7yX041ya_Li9qbkQ@vexing-fowl-23755.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"});
p.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_code TEXT').then(()=> {console.log("Database updated: qr_code added"); process.exit(0);});
