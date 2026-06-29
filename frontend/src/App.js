import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Container, Navbar, Spinner, Badge } from 'react-bootstrap';
import Login from './components/Login';
import Signup from './components/Signup';
import MCQ from './components/MCQ';
import ScenarioQuestion from './components/ScenarioQuestion';
import ProgressDashboard from './components/Dashboard'; // Import Student Dashboard
import AdminDashboard from './components/AdminDashboard';       // Import Admin Dashboard
import './App.css';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  
  // State to manage the current view: 'quiz', 'dashboard', or 'admin_dashboard'
  const [currentView, setCurrentView] = useState('quiz'); 

  // 1. Fetch User Data on Load
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const config = {
            headers: { 'Authorization': `Bearer ${token}` }
          };
          const response = await axios.get('http://localhost:8000/users/me', config);
          const userData = response.data;
          setUser(userData);
          
          // Logic: If Admin, go straight to Admin Dashboard. If Student, stay on Quiz.
          if (userData.is_admin) {
            setCurrentView('admin_dashboard');
          } else {
            setCurrentView('quiz');
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          handleLogout();
        }
      }
      setAuthReady(true);
    };
    fetchUser();
  }, []);

  // 2. Watch for User Login Actions to Redirect Immediately
  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        setCurrentView('admin_dashboard');
      } else if (currentView === 'admin_dashboard') {
        // If a student somehow ends up on admin view, force them back
        setCurrentView('quiz');
      }
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setQuestion(null);
    setCurrentView('quiz');
    setCorrectAnswersCount(0);
  };
  
  const fetchNextQuestion = useCallback(async () => {
    // Admins don't need to fetch questions
    if (user && user.is_admin) return;

    setLoading(true);
    try {
      const config = {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      };
      // Pass the correct_mcq_count to help the IRT/Adaptive logic if needed
      const response = await axios.get(`http://localhost:8000/questions/next?correct_mcq_count=${correctAnswersCount}`, config);
      setQuestion(response.data);
    } catch (err) {
      console.error("Failed to fetch question:", err);
    } finally {
      setLoading(false);
    }
  }, [correctAnswersCount, user]);

  const onNextQuestion = useCallback(async (is_correct) => {
    if (is_correct !== undefined) {
      if (is_correct) {
        setCorrectAnswersCount(prevCount => prevCount + 1);
      } else {
        setCorrectAnswersCount(0); 
      }
    } else {
      setCorrectAnswersCount(0); 
    }
    await fetchNextQuestion();
  }, [fetchNextQuestion]);

  // Only fetch questions if User is logged in, NOT an admin, and looking at the quiz view
  useEffect(() => {
    if (user && !user.is_admin && currentView === 'quiz') {
      fetchNextQuestion();
    }
  }, [user, currentView, fetchNextQuestion]);

  if (!authReady) {
    return (
      <Container className="mt-5 text-center">
        <h2>Loading...</h2>
      </Container>
    );
  }

  // Login/Signup Screens
  if (!user) {
    return isSignup ? (
      <Signup switchToLogin={() => setIsSignup(false)} />
    ) : (
      <Login switchToSignup={() => setIsSignup(true)} setUser={setUser} />
    );
  }

  return (
    <div>
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" className="justify-content-between px-3">
        <Navbar.Brand>
          {user.is_admin ? (
             <span><Badge bg="danger" className="me-2">Admin</Badge> Admin Panel</span>
          ) : (
             <span>Welcome, {user.full_name}</span>
          )}
        </Navbar.Brand>
        
        <div>
          {/* Navigation Buttons - Only Show for Students */}
          {!user.is_admin && (
            <>
              <Button 
                variant={currentView === 'dashboard' ? "light" : "outline-light"} 
                className="me-2"
                onClick={() => setCurrentView('dashboard')}
              >
                My Progress
              </Button>
              <Button 
                variant={currentView === 'quiz' ? "light" : "outline-light"} 
                className="me-2"
                onClick={() => setCurrentView('quiz')}
              >
                Practice
              </Button>
            </>
          )}
          
          <Button variant="outline-danger" onClick={handleLogout}>Logout</Button>
        </div>
      </Navbar>

      <Container className="mt-4">
        {/* Main Content Area */}
        
        {/* 1. ADMIN VIEW */}
        {user.is_admin && currentView === 'admin_dashboard' ? (
          <AdminDashboard />
        ) 
        
        /* 2. STUDENT DASHBOARD VIEW */
        : !user.is_admin && currentView === 'dashboard' ? (
          <ProgressDashboard />
        ) 
        
        /* 3. STUDENT QUIZ VIEW (Default) */
        : (
          loading || !question ? (
            <div className="text-center mt-5">
              <Spinner animation="border" role="status" className="mb-3" />
              <p>Fetching next question...</p>
            </div>
          ) : (
            <div>
              {question.options && question.options.length > 0 ? (
                <MCQ question={question} onNextQuestion={onNextQuestion} />
              ) : (
                <ScenarioQuestion question={question} onNextQuestion={onNextQuestion} />
              )}
            </div>
          )
        )}
      </Container>
    </div>
  );
}

export default App;