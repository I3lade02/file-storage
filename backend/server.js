const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, "uploads");
const THUMBNAILS_DIR = path.join(__dirname, "thumbnails");

// Check that folders exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR);

const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

// API for file upload
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Soubor nebyl nahrán" });

    const filePath = path.join(UPLOADS_DIR, req.file.filename);

    // If file is an image, create a thumbnail
    if (req.file.mimetype.startsWith("image/")) {
        const thumbnailPath = path.join(THUMBNAILS_DIR, req.file.filename);
        try {
            await sharp(filePath).resize(100, 100).toFile(thumbnailPath);
        } catch (error) {
            return res.status(500).json({ message: "Chyba při vytváření miniatury." });
        }
    }

    res.json({ message: "Soubor nahrán", fileName: req.file.filename });
});

// API for file list
app.get("/files", (req, res) => {
    fs.readdir(UPLOADS_DIR, (err, files) => {
        if (err) return res.status(500).json({ message: "Chyba při načítání souborů." });

        const fileList = files.map((file) => {
            const filePath = path.join(UPLOADS_DIR, file);
            return {
                name: file,
                type: path.extname(filePath),
            };
        });

        res.json({ files: fileList });
    });
});

// API for download
app.get("/download/:fileName", (req, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.fileName);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: "Soubor nenalezen" });
    }
});

// API for deleting files
app.delete("/delete/:fileName", (req, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.fileName);
    const thumbnailPath = path.join(THUMBNAILS_DIR, req.params.fileName);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
        res.json({ message: "Soubor byl úspěšně smazán" });
    } else {
        res.status(404).json({ message: "Soubor nenalezen" });
    }
});

// API for thumbnails loading 
app.get("/thumbnails/:fileName", (req, res) => {
    const thumbnailPath = path.join(THUMBNAILS_DIR, req.params.fileName);
    if (fs.existsSync(thumbnailPath)) {
        res.sendFile(thumbnailPath);
    } else {
        res.status(404).json({ message: "Soubor nenalezen" });
    }
});

// API for renaming files
app.post("/rename", (req, res) => {
    const { oldName, newName } = req.body;
    const oldPath = path.join(UPLOADS_DIR, oldName);
    const newPath = path.join(UPLOADS_DIR, newName);
    const oldThumbnailPath = path.join(THUMBNAILS_DIR, oldName);
    const newThumbnailPath = path.join(THUMBNAILS_DIR, newName);

    if (!fs.existsSync(oldPath)) {
        return res.status(404).json({ success: false, message: "Soubor nenalezen." });
    }

    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Chyba při přejmenování souboru." });
        }

        // If thumbnail exists, rename it
        if (fs.existsSync(oldThumbnailPath)) {
            fs.rename(oldThumbnailPath, newThumbnailPath, (thumbErr) => {
                if (thumbErr) {
                    console.error("Chyba při přejmenování thumbnailu:", thumbErr);
                }
            });
        }

        res.json({ success: true, message: "Soubor úspěšně přejmenován.", oldThumbnailName: oldName });
    });
});

// Server start
app.listen(PORT, () => console.log(`Server běží na http://localhost:${PORT}`));