import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types'; // <--- Import this
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      else setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    try {
      // Check Super Admin
      const { data: superAdmin } = await supabase.from('app_admins').select('*').eq('user_id', userId).single();
      if (superAdmin) {
        setRole('super_admin');
      } else {
        // Check Org Role
        const { data: member } = await supabase.from('organization_members').select('role').eq('user_id', userId).single();
        setRole(member?.role || 'user');
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setRole('user'); // Default to user on error
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// <--- Add this validation block
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);