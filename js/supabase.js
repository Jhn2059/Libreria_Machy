// ============================================
// Supabase Client Configuration
// ============================================
const SupabaseConfig = {
  url: null,
  key: null,
  client: null,

  init(url, key) {
    this.url = url;
    this.key = key;
    this.client = supabase.createClient(url, key);
    console.log('✅ Supabase client initialized');
    return this.client;
  },

  getClient() {
    return this.client;
  },

  isConnected() {
    return this.client !== null;
  },

  async test() {
    if (!this.client) return false;
    try {
      const { data, error } = await this.client.from('categorias').select('count').single();
      return !error;
    } catch (e) {
      return false;
    }
  }
};

window.SupabaseConfig = SupabaseConfig;