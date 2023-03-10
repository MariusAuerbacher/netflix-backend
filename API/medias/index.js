import Express from "express";
import { getMedias, writeMedias } from "../../lib/medias-tools.js";
import uniqid from "uniqid";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { getPDFReadableStream } from "../../lib/pdf-tools.js";
import { pipeline } from "stream";
import axios from "axios";
import { checkMediasSchema, triggerBadRequest } from "./validation.js";

const mediasRouter = Express.Router();
const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "netflix-backend/public/images",
    },
  }),
}).single("poster");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, coverJSONPath);
  },
  filename: function (req, file, cb) {
    const originalFileExtension = extname(file.originalname);
    cb(null, req.params.id + originalFileExtension);
  },
});

const upload = multer({ storage: storage });

const coverJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/images"
);

mediasRouter.post(
  "/",
  checkMediasSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const newMedia = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        imdbID: uniqid(),
      };
      const mediasArray = await getMedias();
      mediasArray.push(newMedia);

      await writeMedias(mediasArray);
      res.status(201).send({ imdbID: newMedia.imdbID });
    } catch (error) {
      next(error);
    }
  }
);

mediasRouter.get("/", async (req, res, next) => {
  try {
    const mediasArray = await getMedias();
    if (req.query.title) {
      //search by title
      const result = mediasArray.filter((media) =>
        media.title.includes(req.query.title)
      );
      if (result.length > 0) {
        res.send(result);
      } else {
        const moviesRes = await axios.get(
          `https://www.omdbapi.com/?apikey=2beaba4d&s=${req.query.title}`
        );
        const movies = moviesRes.data.Search.map((media) => {
          return {
            title: media.Title,
            year: media.Year,
            imdbID: media.imdbID,
            type: media.Type,
            poster: media.Poster,
          };
        });
        const moviesArray = [...mediasArray, ...movies];
        await writeMedias(moviesArray);
        res.send(movies);
      }
    } else {
      res.send(mediasArray);
    }
  } catch (error) {
    next(error);
  }
});
mediasRouter.get("/:imdbID", async (req, res, next) => {
  try {
    const mediasArray = await getMedias();

    const foundMedias = mediasArray.find(
      (media) => media.imdbID === req.params.imdbID
    );

    if (!foundMedias) {
      next({ status: 400, message: "Post not found" });
      return;
    }

    res.send(foundMedias);
  } catch (error) {
    next(error);
  }
});

mediasRouter.post(
  "/:id/poster", //cloudinaryUploader
  upload.single("poster"),
  async (req, res, next) => {
    try {
      const imgURL = `http://localhost:3001/public/${req.params.id}${extname(
        req.file.originalname
      )}`;

      const mediasArray = await getMedias();
      const index = mediasArray.findIndex(
        (media) => media.id === req.params.id
      );
      const oldMedia = mediasArray[index];
      const updatedMedia = { ...oldMedia, poster: imgURL };
      mediasArray[index] = updatedMedia;

      await writeMedias(mediasArray);

      res.send(updatedMedia);
    } catch (error) {
      next(error);
    }
  }
);

mediasRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const medias = await getMedias();
    const foundMedias = medias.find((b) => b.id === req.params.id);

    if (foundMedias) {
      res.setHeader("Content-Disposition", "attachment; filename=media.pfd");
      const source = getPDFReadableStream(foundMedias);
      const destination = res;

      pipeline(source, destination, (err) => {
        if (err) console.log(err);
      });
    }
  } catch (error) {
    next(error);
  }
});

export default mediasRouter;
