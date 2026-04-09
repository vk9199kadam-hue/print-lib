import pg from 'pg';
const {Pool} = pg;
const p = new Pool({connectionString: "postgresql://viraj:XoUeuB7yX041ya_Li9qbkQ@vexing-fowl-23755.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"});
p.query("INSERT INTO shopkeepers (name, email, password, shop_name) VALUES ('PrintEase Admin', 'shop@printease.com', 'shop123', 'PrintEase Main Shop') ON CONFLICT (email) DO UPDATE SET password = 'shop123'").then(()=> {console.log("Shop account secured"); process.exit(0);});
