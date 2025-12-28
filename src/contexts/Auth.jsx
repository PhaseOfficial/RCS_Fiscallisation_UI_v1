import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AUTH: Starting session check...");

    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("AUTH ERROR (GetSession):", error);
        setLoading(false); // Stop loading even if error
        return;
      }
      
      console.log("AUTH: Session found?", !!session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("AUTH: State change event:", _event);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    try {
      console.log("AUTH: Fetching role for", userId);
      
      // 1. Check Super Admin
      const { data: superAdmin, error: saError } = await supabase
        .from('app_admins')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

      if (superAdmin) {
        console.log("AUTH: Role is Super Admin");
        setRole('super_admin');
        setLoading(false);
        return;
      }

      // 2. Check Org Role
      const { data: member, error: memError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (member) {
        console.log("AUTH: Role is", member.role);
        setRole(member.role);
      } else {
        console.log("AUTH: No role found (User)");
        setRole('user');
      }
    } catch (err) {
      console.error("AUTH: Role fetch error", err);
    } finally {
      setLoading(false); // ALWAYS finish loading
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);