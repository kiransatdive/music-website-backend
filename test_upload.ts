import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/test-upload', upload.single('track'), (req, res) => {
  console.log('Received body:', req.body);
  console.log('Received file:', req.file);
  res.json({ success: true, body: req.body });
});

app.listen(3002, () => console.log('Test server running on 3002'));
