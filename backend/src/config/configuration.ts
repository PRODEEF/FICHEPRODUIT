export default (): {
  port: number;
  nodeEnv: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  openaiApiKey: string;
  openaiModel: string;
  tavilySearchApiKey: string;
  tavilySearchDepth: string;
  tavilyCountry: string;
} => ({
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  supabaseUrl: process.env['SUPABASE_URL'] ?? '',
  supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] ?? '',
  supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  openaiApiKey: process.env['OPENAI_API_KEY'] ?? '',
  openaiModel: process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini',
  tavilySearchApiKey:
    process.env['TAVILY_API_KEY'] ??
    process.env['TAVILY_SEARCH_API_KEY'] ??
    '',
  tavilySearchDepth: process.env['TAVILY_SEARCH_DEPTH'] ?? 'basic',
  tavilyCountry: (() => {
    const raw = process.env['TAVILY_COUNTRY'];
    if (raw === undefined || raw.trim() === '') return 'france';
    const t = raw.trim().toLowerCase();
    if (t === 'none' || t === 'off') return '';
    return raw.trim();
  })(),
});
