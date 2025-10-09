import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";

// Left side branding component
const Branding = () => (
  <div 
    className="relative w-1/2 p-12 text-white flex flex-col justify-center items-start bg-cover bg-center"
    style={{ backgroundImage: "url('https://images.pexels.com/photos/256517/pexels-photo-256517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')" }}
  >
    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div>
    <div className="relative z-10">
      <h1 className="font-poppins text-5xl font-bold mb-4">MCQ Portal</h1>
      <p className="font-sans text-lg text-gray-200">
        Your gateway to creating and reviewing quality questions.
      </p>
    </div>
  </div>
);

// Role selector component
const RoleSelector = ({ role, setRole }) => {
  const isMaker = role === "maker";
  const isChecker = role === "checker";

  return (
    <div className="flex w-full bg-gray-200 rounded-lg p-1 mb-8">
      <button
        onClick={() => setRole("maker")}
        className={`w-1/2 py-2 rounded-md font-bold transition-all duration-300 ${isMaker ? "bg-blue-600 text-white shadow-md" : "text-gray-600"}`}>
        Maker
      </button>
      <button
        onClick={() => setRole("checker")}
        className={`w-1/2 py-2 rounded-md font-bold transition-all duration-300 ${isChecker ? "bg-green-600 text-white shadow-md" : "text-gray-600"}`}>
        Checker
      </button>
    </div>
  );
};

// Main Login Page Component
export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("maker");

  const handleLogin = async () => {
    if (!email || !password) return alert("Please enter both email and password.");

    const res = await login(email, password, role);
    if (!res.success) return alert(res.message);

    navigate(`/${role}`);
  };

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const isMaker = role === "maker";
  const primaryColor = isMaker ? "blue" : "green";

  return (
    <div className="flex min-h-screen font-sans">
      <Branding />
      <div className="w-1/2 flex justify-center items-center bg-gray-100 p-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Sign In</h2>
          <p className="text-gray-600 mb-8">Select your role and enter your credentials.</p>

          <RoleSelector role={role} setRole={setRole} />

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className={`w-12 h-12 border-4 border-${primaryColor}-500 border-t-transparent rounded-full animate-spin`}></div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="flex flex-col gap-6">
              <div className="relative">
                <FiMail className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 transition`}
                />
              </div>
              <div className="relative">
                <FiLock className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 transition`}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-3 mt-4 rounded-lg bg-${primaryColor}-600 text-white font-bold shadow-lg hover:bg-${primaryColor}-700 transform hover:scale-105 transition-all duration-300`}
              >
                Sign In as {isMaker ? "Maker" : "Checker"}
              </button>
              {/* <p className="text-center text-sm text-gray-500 mt-4">
                <a href="#" className="hover:underline">Forgot Password?</a>
              </p> */}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
