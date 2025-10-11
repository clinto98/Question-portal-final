import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";

// Left side branding component
const Branding = () => (
  <div 
    className="relative hidden lg:flex w-1/2 p-12 text-white flex-col justify-center items-start bg-cover bg-center"
    style={{ backgroundImage: "url('https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')" }}
  >
    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div>
    <div className="relative z-10">
      <h1 className="font-poppins text-5xl font-bold mb-4">MCQ Portal</h1>
      <p className="font-sans text-lg text-gray-200">
        Expert Review and Finalization Console.
      </p>
    </div>
  </div>
);

// Main Expert Login Page Component
export default function ExpertLogin() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const primaryColor = "blue"; // Expert theme color

  const handleLogin = async () => {
    if (!email || !password) return alert("Please enter both email and password.");

    const res = await login(email, password, "expert");
    if (!res.success) return alert(res.message);
    
    navigate("/expert");
  };

  useEffect(() => {
    if (user && user.role === "expert") {
      navigate("/expert");
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen font-sans">
      <Branding />
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-gray-100 p-8 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Expert Sign In</h2>
          <p className="text-gray-600 mb-8">Use your expert credentials to log in.</p>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className={`w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
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
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
              </div>
              <div className="relative">
                <FiLock className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-3 mt-4 rounded-lg bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300`}
              >
                Sign In as Expert
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}