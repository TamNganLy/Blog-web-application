import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public", {maxAge: 0}));

let data = JSON.parse(fs.readFileSync("data/data.json"));

const upload = multer({ dest: "public/videos" });

/*** Home Page ***/
app.get("/", (req, res) => {
  // data = JSON.parse(fs.readFileSync("data/data.json"));
  res.render("index.ejs", {data});
});

/*** Create Post Page ***/
app.get("/create", (req, res) => {
  res.render("create-edit.ejs");
});

/*** Edit Page ***/
app.get("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const editPost = data.find(post => post.id === id);
  let quote = "";
  if (editPost) {
    quote = editPost.quote;
  };

  res.render("create-edit.ejs", {
    id,
    quote
  });
});

/*** Create new Post ***/
app.post("/upload", upload.single("video"), (req, res) => {
  const id = data.length ? data[data.length - 1].id + 1 : 1;
  const ext = path.extname(req.file.originalname);
  const videoName = `video-${id}${ext}`;

  const oldPath = req.file.path;
  const newPath = path.join("public/videos", videoName);
  fs.renameSync(oldPath, newPath);

  const newPost = {
    id,
    video: `/videos/${videoName}`,
    quote: req.body.quote
  };

  data.push(newPost);
  fs.writeFileSync("./data/data.json", JSON.stringify(data, null, 2));

  console.log(`Saved post ${id}`);
  res.redirect("/");
});

/*** Edit Post ***/
app.post("/upload/:id", upload.single("video"), (req, res) => {
  const id = parseInt(req.params.id);
  const postIndex = data.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).send("Post not found");
  }

  const post = data[postIndex];

  // Update quote
  if (req.body.quote) {
    post.quote = req.body.quote.trim();
  }

  // If new video uploaded, replace old one
  if (req.file) {
    const ext = path.extname(req.file.originalname);
    const videoName = `video-${id}${ext}`;
    const newPath = path.join("public/videos", videoName);

    // Delete old video
    const oldVideoPath = path.join("public", post.video.replace(/^\//, ""));
    if (fs.existsSync(oldVideoPath)) {
      fs.unlinkSync(oldVideoPath);
    }

    // Move new file to public/videos
    if (fs.existsSync(req.file.path)) {
      fs.renameSync(req.file.path, newPath);
      post.video = `/videos/${videoName}`;
    }
  }

  // Save updated data
  fs.writeFileSync("./data/data.json", JSON.stringify(data, null, 2));

  res.redirect("/");
});

/*** Delete Post ***/
app.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const postToDelete = data.find(post => post.id === id);
  if (postToDelete) {
    const videoPath = path.join("public", postToDelete.video);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);;
    }
  };

  data = data.filter(post => post.id != id)

  fs.writeFileSync("./data/data.json", JSON.stringify(data, null, 2));

  res.redirect("/");
})

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
})