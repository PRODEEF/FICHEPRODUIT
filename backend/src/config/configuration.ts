export default (): {
  port: number;
  nodeEnv: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  openaiApiKey: string;
  openaiModel: string;
} => ({
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  supabaseUrl: process.env['SUPABASE_URL'] ?? '',
  supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] ?? '',
  supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  openaiApiKey: process.env['OPENAI_API_KEY'] ?? '',
  openaiModel: process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini',
});
