import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { host } from "../utils/APIRoutes";



const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, role }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // start as true

  // Check auth from localStorage when app loads
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        setUser({ email: decoded.email, role: decoded.role || decoded.type });
        setToken(storedToken);
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("token");
      }
    }
    setLoading(false); // done checking
  }, []);

  // Login function
  const login = async (email, password, roleType) => {
    // roleType = "user" | "maker" | "checker" | "expert"
    setLoading(true);
    try {
      let endpoint = `${host}/api/auth/login`;
      if (roleType === "maker") endpoint += "/maker";
      else if (roleType === "checker") endpoint += "/checker";
      else if (roleType === "expert") endpoint += "/expert";
      else endpoint += "/admin";
      const res = await axios.post(endpoint, { email, password });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);

        const decoded = jwtDecode(res.data.token);
        // store role in localStorage
        localStorage.setItem("role", decoded.type);

        setUser({ email: decoded.email, role: decoded.type });
        return { success: true, role: decoded.type };
      }
    } catch (err) {
      console.error("Login failed", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = (navigate) => {
    const role = user?.role;
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    setToken(null);

    if (role === "maker") navigate("/");
    else if (role === "checker") navigate("/");
    else if (role === "expert") navigate("/login/expert");
    else navigate("/login/admin");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
