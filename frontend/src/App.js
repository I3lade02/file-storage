import React, { useState, useEffect, useRef } from "react";
import './App.css';
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true'); 
  const fileInputRef = React.createRef();
  const dropRef = useRef();

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
      setErrorMessage("Špatné heslo! Zkus to znovu.");
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
      setUploadMessage("❌ Prosím vyberte soubor před nahráním.");
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
        setUploadMessage("✅ Soubor úspěšně nahrán.");
        setUploadMessage(data.message);
        setFiles([...files, { name: file.name, type: file.type, size: file.size }]);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; //Resets input field
        }
      })
      .catch(() => {
        setUploadMessage("❌ Chyba při nahrávání souboru.");
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

  
  //Handle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem("darkMode", !darkMode);
  };
  
  const handleDragOver = (e) => {
  e.preventDefault();
    dropRef.current.classList.add("drag-over");
  }; 

  const handleDragLeave = () => {
    dropRef.current.classList.remove("drag-over");
  }

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFile(files[0]);
    }
  };


  const toggleFileSelection = (fileName) => {
    setSelectedFiles((prevSelected) => 
      prevSelected.includes(fileName)
      ? prevSelected.filter((name) => name !== fileName)
      : [...prevSelected, fileName]
    );
  };

  const handleBulkDelete = () => {
    selectedFiles.forEach((file) => handleFileDelete(file));
    setSelectedFiles([]);
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
    <Container className={`p-4 ${darkMode ? "dark-mode" : ""}`}>
      <Nav className="justify-content-between mb-4 p-3 shadow rounded bg-light">
        <div className="d-flex">
          <Nav.Item>
            <Nav.Link href="#" className="fw-bold text-dark">📂 Nahrát soubor</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="#" className="fw-bold text-dark">📁 Seznam souborů</Nav.Link> 
          </Nav.Item>
        </div>
        {isAuthenticated && (
          <Button variant="outline-danger" onClick={handleLogout}>🚪 Odhlásit</Button>
        )}
        <Button variant="outline-secondary" onClick={toggleDarkMode}>
          {darkMode ? "🌞 Světlý režim" : "🌙 Tmavý režim"}
        </Button>
      </Nav>

      <h1 className="text-center mb-4 fw-bold text-primary">📦 Správce souborů</h1>

      <Row className="gx-5">
        <Col md={5}>
          <Card className="p-4 shadow-lg rounded">
            <h4 className="text-center text-success">📤 Nahrát soubor</h4>
            <div
              ref={dropRef}
              className="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave} 
              onDrop={handleDrop}           
            >
              Přetáhněte soubor sem nebo ho vyberte
            </div>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Control type="file" ref={fileInputRef} onChange={handleFileChange} className="p-2" />
            </Form.Group>
            <Button variant="success" className="w-100 p-2 fw-bold" onClick={handleFileUpload}>Nahrát soubor</Button>
            {uploadMessage && <Alert variant="info" className="mt-3">{uploadMessage}</Alert>}
          </Card>
        </Col>

        <Col md={7}>
          <Card className="p-4 shadow-lg rounded">
            <h4 className="text-center text-primary">📁 Seznam souborů</h4>
            <Button variant="danger" className="mb-3" onClick={handleBulkDelete} disabled={selectedFiles.length === 0}>
              🗑️ Smazat vybrané soubory
            </Button>
            <ListGroup>
              {files.map((file) => (
                <ListGroup.Item key={file.name} className="d-flex justify-content-between align-items-center">
                  <Form.Check type="checkbox" onChange={() => toggleFileSelection(file.name)} />
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Form.Control
              type="text"
              placeholder="🔍 Vyhledat soubor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3 p-2"
            />
            <Form.Select
              className="mb-3 p-2"
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
            >
              <option value="">📌 Všechny typy</option>
              <option value="image/">🖼️ Obrázky</option>
              <option value="video/">🎥 Videa</option>
              <option value="application/pdf">📄 PDF</option>
            </Form.Select>
            <ListGroup className="shadow-sm rounded">
              {filteredFiles.map((file, index) => (
                <ListGroup.Item
                  key={index}
                  className="d-flex justify-content-between align-items-center p-3 shadow-sm mb-2 rounded"
                >
                  <div className="d-flex align-items-center">
                    {file.type.startsWith("image/") && (
                      <Image src={`http://localhost:5000/thumbnails/${file.name}`} thumbnail width={50} height={50} className="me-3 rounded"/>
                    )}
                    <span className="fw-bold">{file.name}</span>
                  </div>
                  <div className="d-flex">
                    <Button variant="outline-primary" size="sm" className="me-1" href={`http://localhost:5000/download/${file.name}`} download>
                      ⬇
                    </Button>
                    <Button variant="outline-warning" size="sm" className="me-1" onClick={() => setRenameFileName(file.name)}>
                      ✏
                    </Button>
                    <Button variant="outline-danger" size="sm" className="me-1" onClick={() => handleFileDelete(file.name)}>
                      ❌
                    </Button>
                  </div>
                  {renameFileName === file.name && (
                    <InputGroup className="mt-2">
                      <Form.Control placeholder="Nový název" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} />
                      <Button variant="success" size="sm" onClick={() => handleFileRename(file.name)}>✔</Button>
                    </InputGroup>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;