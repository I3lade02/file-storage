import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Form, Button, Card, Nav, Row, Col, Alert, ListGroup, Image, InputGroup } from "react-bootstrap";

function App() {
  // Hooks declaration
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [renameFileName, setRenameFileName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  
  // Load files on component mount
  useEffect(() => {
    fetch("http://localhost:5000/files")
      .then((response) => response.json())
      .then((data) => setFiles(data.files))
      .catch((error) => console.error("Error loading files", error));
  }, []);

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setErrorMessage("");
    } else {
      setErrorMessage("Incorrect password! Please try again.");
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload
  const handleFileUpload = () => {
    if (!file) {
      setUploadMessage("Please select a file.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setUploadMessage(data.message);
        setFiles([...files, { name: file.name, type: file.type }]);
      })
      .catch(() => {
        setUploadMessage("Error uploading file.");
      });
  };

  // Handle file delete
  const handleFileDelete = (fileName) => {
    fetch(`http://localhost:5000/delete/${fileName}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then(() => {
        setFiles(files.filter((file) => file.name !== fileName));
      })
      .catch(() => {
        console.error("Error deleting file");
      });
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (fileTypeFilter ? file.type.startsWith(fileTypeFilter) : true)
  );

  // Handle file rename
  const handleFileRename = (fileName) => {
    if (!newFileName.trim()) return;
  
    fetch("http://localhost:5000/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName: fileName, newName: newFileName }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setFiles(files.map(file => file.name === fileName ? { ...file, name: newFileName } : file));
          setRenameFileName("");
          setNewFileName("");
        } else {
          alert("Error renaming file: " + data.message);
        }
      })
      .catch(() => {
        alert("Error communicating with the server.");
      });
  };

  // Render login form if not authenticated
  if (!isAuthenticated) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Card style={{ width: "300px" }}>
          <Card.Body>
            <h3 className="text-center">Login</h3>
            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>
              {errorMessage && <Alert variant="danger" className="text-center">{errorMessage}</Alert>}
              <Button type="submit" variant="primary" className="w-100">
                Login
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Render dashboard if authenticated
  return (
    <Container>
      <Nav className="justify-content-between mt-4">
        <div>
          <Nav.Item>
            <Nav.Link href="#">Upload File</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="#">File List</Nav.Link>
          </Nav.Item>
        </div>
        {isAuthenticated && (
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        )}
      </Nav>
      <h1 className="mt-4 text-center">File Storage Dashboard</h1>
      <Row className="mt-4">
        <Col md={6} className="text-center">
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Select File</Form.Label>
            <Form.Control type="file" onChange={handleFileChange} />
          </Form.Group>
          <Button variant="success" className="w-75" onClick={handleFileUpload}>Upload File</Button>
          {uploadMessage && <Alert variant="info" className="mt-3">{uploadMessage}</Alert>}
        </Col>
        <Col md={6}>
          <h4>File List</h4>
          <Form.Control 
            type="text" 
            placeholder="Search file..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="mb-3"
          />
          <Form.Select 
            className="mb-3" 
            value={fileTypeFilter} 
            onChange={(e) => setFileTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="image/">Images</option>
            <option value="video/">Videos</option>
            <option value="application/pdf">PDFs</option>
          </Form.Select>
          <ListGroup>
            {filteredFiles.map((file, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                {file.type.startsWith("image/") && <Image src={`http://localhost:5000/thumbnails/${file.name}`} thumbnail width={50} height={50} />}
                {file.name}
                <div>
                  <Button variant="primary" size="sm" className="me-1" href={`http://localhost:5000/download/${file.name}`} download>⬇</Button>
                  <Button variant="primary" size="sm" className="me-1" onClick={() => setRenameFileName(file.name)}>✏</Button>
                  <Button variant="primary" size="sm" className="me-1" onClick={() => handleFileDelete(file.name)}>❌</Button>
                </div>
                {renameFileName === file.name && (
                  <InputGroup className="mt-2">
                    <Form.Control placeholder="New Name" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} />
                    <Button variant="success" size="sm" onClick={() => handleFileRename(file.name)}>✔</Button>
                  </InputGroup>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}

export default App;