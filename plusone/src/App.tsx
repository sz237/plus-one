import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import MyPage from "./pages/MyPage";
import MakePost from "./pages/MakePost";
import Messages from "./pages/Messages";
import Search from "./pages/Search";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/home" element={<Home />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/makepost" element={<MakePost />} /> {/* create or edit */}

      <Route path="/messages" element={<Messages />} />
      <Route path="/search" element={<Search />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
