import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session safely
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session && mounted) {
          await fetchProfile(session.user.id, session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        if (mounted) setLoading(false);
      }
    };
    getSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session) {
        // Only fetch profile if user changed or barely loaded
        // This prevents double fetching if getSession already did it
        // However, onAuthStateChange is more reliable for updates
        await fetchProfile(session.user.id, session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId, authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
         // Profile might not exist yet if trigger hasn't run, fallback to metadata
         console.warn('Profile fetch error:', error);
      }
      
      setUser({
        ...authUser,
        ...(data || {}),
        role: data?.role || authUser.user_metadata?.role || 'voter'
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error('Error logging out');
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';
  const isVoter = () => user?.role === 'voter';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isVoter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
