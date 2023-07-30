const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const connectedUsers = new Map();

app.use(cors());

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '');
    cb(null, uniqueSuffix + '-' + sanitizedFilename);
  }
});


const upload = multer({ storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('user_connected', (userInfo) => {
    console.log('User connected:', userInfo);
    connectedUsers.set(socket.id, userInfo);
    io.emit('user_list', Array.from(connectedUsers.values()));
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    connectedUsers.delete(socket.id);
    io.emit('user_list', Array.from(connectedUsers.values()));
  });

  socket.on('new_message', (message) => {
    console.log('New message:', message);
    io.emit('new_message', message); 
  });
});

app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});


const port = 4000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});