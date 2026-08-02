import pg from 'pg';
const { Pool } = pg;

// Connection Pool to PostgreSQL Database
const pool = new Pool({
  connectionString: process.env.POSTGRES_URI || 'postgresql://postgres:postgres@localhost:5432/pivoc',
});

export const initPostgres = async () => {
  try {
    const client = await pool.connect();
    console.log('[PostgreSQL] Connected to Relational Store');
    
    // Create hardware device mapping table with cryptographic hashes
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_nodes (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) UNIQUE NOT NULL,
        hardware_hash VARCHAR(64) NOT NULL,
        cgroup_quota INT DEFAULT 20,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed default RISCV node entry
    await client.query(`
      INSERT INTO device_nodes (device_id, hardware_hash, cgroup_quota)
      VALUES ('RISCV_NODE_01', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 20)
      ON CONFLICT (device_id) DO NOTHING;
    `);

    client.release();
  } catch (err) {
    console.warn('[Postgres Warning] Running without local PostgreSQL instance:', err.message);
  }
};

export default pool;