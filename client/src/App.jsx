import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './HomePage';
import Login from './components/Login/Login';
import CorporateRegister from './components/Register/CorporateRegister';
import SelectType from './components/SelectType';
import NGORegister from './components/Register/NgoRegister';
import SuccessStories from './components/SuccessStories';
import AboutUs from './components/AboutUs';

export default function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Login" element={<Login/>} />
          <Route path="/SelectType" element={<SelectType/>} />
          <Route path="/CorporateRegister" element={<CorporateRegister/>} />
          <Route path="/NGORegister" element={<NGORegister/>} />
          <Route path="/success-stories" element={<SuccessStories/>} />
          <Route path="/about-us" element={<AboutUs/>} />
        </Routes>
      </div>
    </Router>
  );
}
