import { PoolClient } from 'pg';

export async function nextVoucherNumber(client: PoolClient, year: number): Promise<string> {
  const { rows } = await client.query(
    `INSERT INTO voucher_counters(year,last_value) VALUES ($1,1)
     ON CONFLICT (year) DO UPDATE SET last_value = voucher_counters.last_value + 1
     RETURNING last_value`,
    [year]
  );
  const seq = rows[0].last_value as number;
  return `VCH-${year}-${String(seq).padStart(6, '0')}`;
}
