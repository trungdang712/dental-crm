import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Reading migration file...')
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '001_crm_schema.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  console.log('Running migration...')

  // Split by semicolons but be careful with function bodies
  // We'll run each statement separately
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (const statement of statements) {
    if (!statement || statement.startsWith('--')) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

      if (error) {
        // Try direct execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement + ';' })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
      }
      successCount++
    } catch (err) {
      // Some statements may fail if objects already exist, that's OK
      const msg = err.message || String(err)
      if (!msg.includes('already exists') && !msg.includes('duplicate')) {
        console.log(`Note: ${statement.substring(0, 50)}... - ${msg}`)
      }
      errorCount++
    }
  }

  console.log(`\nMigration complete: ${successCount} statements executed, ${errorCount} skipped/failed`)
}

runMigration().catch(console.error)
