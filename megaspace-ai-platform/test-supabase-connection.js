// 直接测试Supabase连接
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2Roemd4dGR6cnZjY2Rka2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjM2NzIsImV4cCI6MjA3MDc5OTY3Mn0.CKBtRJdl6LkF4kxjjskuRRk-JFex1wIrF2U_Ni13UBI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 测试直接查询
async function testDirectQuery() {
  console.log('Testing direct Supabase query...')
  
  try {
    const { data, error } = await supabase
      .from('public_tools')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('Query error:', error)
      return
    }
    
    console.log('Query successful!')
    console.log('Found tools:', data?.length)
    console.log('Sample data:', data?.[0])
    
  } catch (err) {
    console.error('Connection error:', err)
  }
}

testDirectQuery()