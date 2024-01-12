require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");

const port = process.env.PORT;
const app = express();

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const fileSchema = new mongoose.Schema({
  taskId: String,
  filename: String,
  path: String,
});

const File = mongoose.model("File", fileSchema);

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Welcome to Task Management App");
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "./uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post("/files", upload.any(), async (req, res) => {
  const files = req.files;
  const taskId = req.body.taskId;

  if (Array.isArray(files) && files.length > 0) {
    const savedFiles = await File.create(
      files.map((file) => ({
        taskId,
        filename: file.originalname,
        path: file.path,
      }))
    );

    res.json(savedFiles);
  } else if (req.file) {
    const file = req.file;
    const savedFile = await File.create({
      taskId,
      filename: file.originalname,
      path: file.path,
    });

    res.json(savedFile);
  } else {
    console.error("File upload unsuccessful - No files in the request");
    res
      .status(400)
      .json({ error: "File upload unsuccessful - No files in the request" });
  }
});

app.get("/files/task/:taskId", async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const files = await File.find({ taskId });

    if (!files || files.length === 0) {
      return res.status(404).json({ error: "No files found for the task" });
    }

    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log("Task Management App is running on port :" + port);
});
