import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../api/axiosInstance";
import { persistor } from "../app/store";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // ✅ Logout logic
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
    // 🧹 Clear redux-persist storage also
    persistor.purge();
  }, []);

  // ✅ Token expiry check
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const exp = decoded.exp * 1000;
      // console.log("Token expiry:", new Date(exp).toLocaleString());

      if (Date.now() > exp) {
        console.warn("Token expired. Logging out...");
        handleLogout();
      } else {
        const timeoutId = setTimeout(() => {
          console.warn("Auto logout - token expired");
          handleLogout();
        }, exp - Date.now());

        return () => clearTimeout(timeoutId);
      }
    } catch (err) {
      console.error("Invalid token:", err);
      handleLogout();
    }
  }, [token, handleLogout]);

  // ✅ Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (token) {
          const response = await axiosInstance.get("/auth/me");
          setUser(response.data);
        }
      } catch (err) {
        console.error("Token invalid or expired:", err);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // ✅ Login handler
  const handleLogin = (data) => {
    const { token: jwt, user: userData } = data;
    sessionStorage.setItem("token", jwt);
    setToken(jwt);
    setUser(userData); 
  };
  // console.log("AuthContext - user:", user);
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        handleLogin,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
