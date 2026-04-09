import pg from 'pg';
const {Pool} = pg;
const p = new Pool({connectionString: "postgresql://viraj:XoUeuB7yX041ya_Li9qbkQ@vexing-fowl-23755.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"});
async function run() {
  try {
    const student_id = '07ec0962-10d6-440c-917b-f7ba556e9613'; // Use the UUID we got earlier
    const res = await p.query(
      'INSERT INTO orders (order_id, student_id, student_print_id, student_name, total_bw_pages, total_color_pages, total_pages, spiral_binding, stapling, service_fee, subtotal, total_amount, payment_status, print_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      ['ORD-2026-X', student_id, 'SID-2026-123', 'Test', 10, 0, 10, undefined, undefined, 2, 10, 12, 'paid', 'queued']
    );
    console.log("Create order success:", res.rows[0]);
    // cleanup
    await p.query('DELETE FROM orders WHERE order_id = $1', ['ORD-2026-X']);
  } catch(e) {
    console.error("CockroachDB error:", e);
  } finally {
    process.exit(0);
  }
}
run();
