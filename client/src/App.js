import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Home from "./pages/home/Home";
import List from "./pages/list/List";
import Login from "./pages/login/Login";
import Bookings from "./pages/bookings/Bookings"
import Success from './pages/success/Success';
import Cancel from './pages/cancel/Cancel';
import Profile from "./pages/profile/Profile";
import Register from "./pages/register/Register";
import Map from "./pages/map/Map";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/schedules" element={<List/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register />} />
        <Route path="/myBookings" element={<Bookings />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/map/:id" element={<Map />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
