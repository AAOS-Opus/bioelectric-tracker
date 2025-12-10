import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserSession } from '@/types/user';
import { Phase } from '@/types/phase';

interface UserContextType {
  user: User | null;
  phases: Phase[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  phases: [],
  loading: false,
  error: null,
  login: async () => false,
  logout: () => {},
  refreshUser: async () => {},
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from local storage
  useEffect(() => {
    const initializeUser = async () => {
      setLoading(true);
      try {
        const savedSession = localStorage.getItem('userSession');
        
        if (savedSession) {
          const session: UserSession = JSON.parse(savedSession);
          const now = new Date().getTime();
          
          // Check if the token is expired
          if (session.expiresAt && session.expiresAt > now) {
            setUser(session.user);
            setPhases(session.phases || []);
          } else {
            // Token expired, try to refresh
            await refreshUser();
          }
        }
      } catch (err) {
        console.error('Error initializing user:', err);
        setError('Failed to initialize user session');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.session) {
        setUser(data.session.user);
        setPhases(data.session.phases || []);
        
        // Save session to local storage
        localStorage.setItem('userSession', JSON.stringify(data.session));
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setPhases([]);
    localStorage.removeItem('userSession');
    
    // Call the logout API endpoint
    fetch('/api/auth/logout', {
      method: 'POST',
    }).catch(err => {
      console.error('Logout error:', err);
    });
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to refresh user data');
      }
      
      if (data.session) {
        setUser(data.session.user);
        setPhases(data.session.phases || []);
        
        // Update session in local storage
        localStorage.setItem('userSession', JSON.stringify(data.session));
      } else {
        // If no session, clear user data
        setUser(null);
        setPhases([]);
        localStorage.removeItem('userSession');
      }
    } catch (err: any) {
      console.error('Refresh user error:', err);
      setError(err.message || 'Failed to refresh user data');
      
      // Clear user data on error
      setUser(null);
      setPhases([]);
      localStorage.removeItem('userSession');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        phases,
        loading,
        error,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default useUser;
