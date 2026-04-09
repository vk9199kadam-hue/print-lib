import pg from 'pg';
const {Pool} = pg;
const p = new Pool({connectionString: "postgresql://viraj:XoUeuB7yX041ya_Li9qbkQ@vexing-fowl-23755.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"});

const q = `
  CREATE TABLE IF NOT EXISTS shop_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_open BOOLEAN DEFAULT true,
    closing_message TEXT,
    standard_hours TEXT DEFAULT '10:00 AM to 8:00 PM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO shop_settings (id, is_open) VALUES (1, true) ON CONFLICT (id) DO NOTHING;
`;

p.query(q).then(()=> {console.log("Database updated: shop_settings initialized"); process.exit(0);}).catch(e => {console.error(e); process.exit(1);});
