import pg from 'pg';
const {Pool} = pg;
const p = new Pool({connectionString: "postgresql://viraj:XoUeuB7yX041ya_Li9qbkQ@vexing-fowl-23755.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"});
async function run() {
  try {
    const res = await p.query('INSERT INTO users (name, email, password, gender, student_print_id, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', ["Test", "test@test.com", "pass", "Male", "SID-2026-123", true]);
    console.log("Create user success:", res.rows[0]);
    const res2 = await p.query('SELECT * FROM users WHERE email = $1', ["test@test.com"]);
    console.log("Get user success:", res2.rows[0]);
    // cleanup
    await p.query('DELETE FROM users WHERE email = $1', ["test@test.com"]);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}
run();
