// AdminDashboard.js

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL
const AdminDashboard = () => {
  // --- Stats State ---
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Used for dashboard load errors

  // --- AI Generation State ---
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState(null); // Used for modal feedback

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setTopic("");
    setGenMessage(null);
  };

  // Fetch Stats on Load
  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, config);
      setStats(response.data);
    } catch (err) {
      console.error("Fetch Stats Error:", err);
      setError("Failed to load admin data. Are you authorized?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  // --- FIX APPLIED: Robust Error Handling for Gen AI Call ---
  const handleGenerateQuestions = async () => {
    // Basic client-side check for required field
    if (!topic || topic.trim() === "") {
        setGenMessage({ 
            text: "Please enter a topic to generate questions.", 
            type: "warning" 
        });
        return;
    }

    setGenerating(true);
    setGenMessage(null); 

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      // Send topic and num_questions=250 as query parameters to the POST endpoint
      const response = await axios.post(
        `${API_BASE_URL}/admin/generate-questions?topic=${encodeURIComponent(topic)}&num_questions=10`, 
        {}, // Empty body
        config
      );

      setGenMessage({ 
        text: response.data.message, 
        type: "success" 
      });
      setTopic(""); 
      fetchAdminStats(); // Refresh dashboard stats

    } catch (err) {
      console.error("Gen AI API Call Error:", err.response || err);
      let errorText = "An unexpected server error occurred.";

      if (err.response && err.response.data) {
          const detail = err.response.data.detail;
          
          // --- THE CRITICAL FIX: Extract String from the Detail Object/Array ---
          if (typeof detail === 'string') {
              // Case 1: Standard FastAPI HTTPException detail (e.g., 403 Forbidden message)
              errorText = detail;
          } else if (Array.isArray(detail) && detail.length > 0) {
              // Case 2: Pydantic Validation Error (the object that caused the crash)
              // Extract a user-friendly string from the first error object
              // e.g., "Validation Error in topic: field required"
              const field = detail[0].loc[detail[0].loc.length - 1]; // Get the last field name
              errorText = `Input Error on '${field}': ${detail[0].msg}`;
          } else if (err.response.status === 403) {
              errorText = "Access Denied: You must be an administrator.";
          }
          
      }
      
      // Set the extracted string error message to the state
      setGenMessage({ 
          text: errorText, 
          type: "danger" 
      });

    } finally {
      setGenerating(false);
    }
  };
  // ------------------------------------------------------------------------

  // ... (Rest of component rendering logic)
  
  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /> Loading Dashboard...</div>;
  }

  if (error) {
    return <Alert variant="danger" className="mt-5">{error}</Alert>;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Admin Dashboard</h2>
          <p>Overview of system metrics and question generation tools.</p>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={handleShowModal}>
            Generate New Questions
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      {stats && (
        <Row>
          {/* ... (Existing stats cards) ... */}
          <Col md={4}>
            <Card bg="light" text="dark" className="mb-2">
              <Card.Header>Total Students</Card.Header>
              <Card.Body>
                <Card.Title>{stats.total_students}</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card bg="light" text="dark" className="mb-2">
              <Card.Header>Class Avg. Accuracy</Card.Header>
              <Card.Body>
                <Card.Title>{stats.class_average_accuracy}%</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card bg="light" text="dark" className="mb-2">
              <Card.Header>System Question Count</Card.Header>
              <Card.Body>
                <Card.Title>—</Card.Title> {/* Placeholder for Question Count */}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Student List Table */}
      {stats && stats.student_list && (
        <Row className="mt-4">
          <Col>
            <h4>Student Performance Summary</h4>
            <Table striped bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Attempted</th>
                  <th>Accuracy</th>
                  <th>Ability Score</th>
                </tr>
              </thead>
              <tbody>
                {stats.student_list.map((student, index) => (
                  <tr key={student.email}>
                    <td>{index + 1}</td>
                    <td>{student.full_name}</td>
                    <td>{student.email}</td>
                    <td>{student.questions_attempted}</td>
                    <td>{student.accuracy}%</td>
                    <td>{student.ability_score}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      )}

      {/* Generate Questions Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Generate Questions with Gen AI</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Enter a topic, and the system will generate 250 MCQs and Scenario-Based questions, 
            run the ML predictor to assign their difficulty level automatically.
          </p>
          <Form onSubmit={(e) => { e.preventDefault(); handleGenerateQuestions(); }}>
            <Form.Group className="mb-3">
              <Form.Label><strong>Topic</strong></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter a topic, e.g., 'FastAPI and Database Design'" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                autoFocus
                disabled={generating}
              />
            </Form.Group>
          </Form>
          
          {/* Feedback Message */}
          {genMessage && (
              <Alert variant={genMessage.type} className="mt-3">
                  {genMessage.text}
              </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={generating}>
            Close
          </Button>
          <Button variant="primary" onClick={handleGenerateQuestions} disabled={!topic || generating}>
            {generating ? (
                <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>
                Generating & Analyzing...
                </>
            ) : (
                "Generate Questions"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default AdminDashboard;