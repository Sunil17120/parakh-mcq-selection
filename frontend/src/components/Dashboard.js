import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL
const ProgressDashboard = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 'Authorization': `Bearer ${token}` }
        };
        const response = await axios.get('${API_BASE_URL}/users/progress', config);
        setProgress(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching progress:", err);
        setError("Failed to load progress data.");
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Student Progress Dashboard</h2>
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Ability Score</Card.Title>
              <h1 className="text-primary">{progress.current_ability_score}</h1>
              <Card.Text>IRT Level</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Questions Taken</Card.Title>
              <h1>{progress.total_questions_attempted}</h1>
              <Card.Text>Total</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Accuracy</Card.Title>
              <h1 className={progress.accuracy_rate > 70 ? "text-success" : "text-warning"}>
                {progress.accuracy_rate}%
              </h1>
              <ProgressBar 
                now={progress.accuracy_rate} 
                variant={progress.accuracy_rate > 70 ? "success" : "warning"} 
                className="mt-2" 
                style={{height: '10px'}}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <Card.Title>Scenario Avg</Card.Title>
              <h1>{progress.scenario_average_score}</h1>
              <Card.Text>NLP Score</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent History Table */}
      <Card className="shadow-sm">
        <Card.Header as="h5">Recent Activity</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Date</th>
                <th>Question</th>
                <th>Result</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {progress.recent_history.length > 0 ? (
                progress.recent_history.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td style={{maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                      {item.question_text}
                    </td>
                    <td>
                      {item.is_correct ? (
                        <span className="badge bg-success">Correct</span>
                      ) : (
                        <span className="badge bg-danger">Incorrect</span>
                      )}
                    </td>
                    <td>{item.score !== null ? item.score.toFixed(2) : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No activity recorded yet.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProgressDashboard;