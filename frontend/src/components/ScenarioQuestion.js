import React, { useState } from 'react';
import { Card, Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL
const ScenarioQuestion = ({ question, onNextQuestion }) => {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState(false); // New state variable

  const handleSubmit = async () => {
    if (answer.trim()) {
      setLoading(true);
      setScore(null);
      setFeedback(false); // Reset feedback

      try {
        const response = await axios.post(
          `${API_BASE_URL}/${question.id}/answer`,
          { answer: answer },
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setScore(response.data.score);
        setFeedback(true); // Set feedback to true on success
      } catch (err) {
        console.error("Failed to submit answer:", err);
      } finally {
        setLoading(false);
      }
    }
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
    <Container className="mt-5">
      <Card>
        <Card.Body>
          <Card.Title>Scenario-Based Question</Card.Title>
          <Card.Text>{question.text}</Card.Text>
          <Form.Group className="mb-3">
            <Form.Label>Your detailed answer:</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={5} 
              placeholder="Type your response here..." 
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={loading || feedback} // Disable input after submission
            />
          </Form.Group>
          <div className="d-flex justify-content-end mt-3">
            {!feedback ? ( // Check for feedback to show buttons
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!answer.trim() || loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button
                variant="info"
                onClick={() => onNextQuestion()}
                disabled={loading}
              >
                Next Question
              </Button>
            )}
          </div>
          {feedback && ( // Conditionally show the alert
            <Alert variant="info" className="mt-3">
              Your score for this scenario is: <strong>{Math.round(score * 100)}%</strong>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ScenarioQuestion;