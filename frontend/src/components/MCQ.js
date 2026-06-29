import React, { useState, useEffect } from 'react';
import { Container, Card, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL
const MCQ = ({ question, onNextQuestion }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds for the timer

  // Timer logic
  useEffect(() => {
    // If feedback is already shown, or the question is loading, don't start a new timer
    if (feedback || loading) return;

    // Start the timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    // When time runs out, automatically submit the answer
    if (timeLeft === 0) {
      clearInterval(timer);
      handleSubmit(true); // Call handleSubmit with auto-submit flag
    }

    // Clean up the timer when the component unmounts or dependencies change
    return () => clearInterval(timer);
  }, [timeLeft, feedback, loading]);

  const handleSubmit = async (autoSubmit = false) => {
    if (!selectedOption && !autoSubmit) return; // Only submit if an option is selected or it's an auto-submit

    setLoading(true);
    setFeedback(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/questions/${question.id}/answer`,
        { answer: selectedOption },
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setFeedback(response.data);
    } catch (err) {
      console.error("Failed to submit answer:", err);
      // Fallback in case of network error, show incorrect feedback
      setFeedback({ is_correct: false, correct_answer: question.answer });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (option) => {
    if (!feedback) {
      setSelectedOption(option);
    }
  };

  const getOptionStyle = (option) => {
    if (feedback) {
      if (option === feedback.correct_answer) {
        return { backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' };
      }
      if (option === selectedOption && !feedback.is_correct) {
        return { backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545' };
      }
    }
    if (option === selectedOption) {
      return { backgroundColor: '#007bff', color: 'white', borderColor: '#007bff' };
    }
    return {};
  };

  if (!question) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Fetching question...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <span>Question {question.id}</span>
          <span className={`timer-text ${timeLeft <= 10 ? 'text-danger' : ''}`}>
            Time Left: {timeLeft}s
          </span>
        </Card.Header>
        <Card.Body>
          <Card.Text>{question.text}</Card.Text>
          <ListGroup>
            {question.options.map((option, index) => (
              <ListGroup.Item
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={!!feedback || loading}
                style={getOptionStyle(option)}
                action
              >
                {option}
              </ListGroup.Item>
            ))}
          </ListGroup>
          <div className="d-flex justify-content-between mt-3">
            {!feedback ? (
              <Button
                variant="primary"
                onClick={() => handleSubmit()}
                disabled={!selectedOption || loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button
                variant="info"
                onClick={() => onNextQuestion(feedback.is_correct)}
                disabled={loading}
              >
                Next Question
              </Button>
            )}
          </div>
          {feedback && (
            <Alert
              variant={feedback.is_correct ? 'success' : 'danger'}
              className="mt-3"
            >
              {feedback.is_correct ? 'Correct!' : `Incorrect. The correct answer was "${feedback.correct_answer}".`}
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MCQ;