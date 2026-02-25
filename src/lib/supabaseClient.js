import { createClient } from '@supabase/supabase-js'

// 从环境变量读取 Supabase 配置
// 本地开发：在项目根目录创建 .env 文件，参考 .env.example
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables!\n' +
    'Please create a .env file in the project root with:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key\n' +
    'See .env.example for reference.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

