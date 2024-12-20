const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const connectDB = require('./config/db.config');
const authRoutes = require('./routes/auth.routes');
const meetingsRoutes = require('./routes/Meeting')
const userRoutes = require('./routes/user.routes');
const chatRoutes = require('./routes/chat.routes');
const messageRoutes = require('./routes/message.routes')
const { globalErrorHandler } = require('./middleware/error.middleware');
const meetingRoutes = require('./routes/Meeting.js');
const focusSessionRoutes = require('./routes/FocusSessionRoutes');
const groupRoutes = require('./routes/GroupRoutes');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;
const server=require('http').createServer(app);

// Connect to MongoDB
connectDB().then(() => {
  console.log('Connected to MongoDB');
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

app.get('/', (req, res) => {
  console.log(req.body);
  res.send('Server is active!');
});

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  //client setup
  socket.on("setup", (userData) => {
    socket.join(userData.user.id);
    console.log(`${userData.user.username} joined room-${userData.user.id}`);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`User Joined to chat Room: ${room}`);
  });

  socket.on("new message", (newMessageRec) => {
    let chat = newMessageRec.chat;
    console.log(chat.users);

    if (!chat.users) return console.log("Chat users not defined");
    chat.users.forEach((user) => {
      socket.in(user._id).emit("message received", newMessageRec);
    });
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meeting', meetingsRoutes);
app.use('/api/focus-session', focusSessionRoutes);
app.use('/api/group',groupRoutes);
app.use('/api/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/meeting', meetingRoutes);

const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudinary = require("./config/cloudinary.config");

app.post("/api/upload", upload.single("profileImage"), async (req, res) => {
  const { username } = req.body; 
  const fileBuffer = req.file;

  try {
    const result = await cloudinary.uploader.upload_stream(
      { public_id: `profile_images/${username}`, overwrite: true },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return res.status(500).json({ message: "Image upload failed" });
        }
        res.status(200).json({ imageUrl: result.secure_url });
      }
    ).end(fileBuffer.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// 404 wala error
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(globalErrorHandler);

