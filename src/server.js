import Express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import mediasRouter from "../API/medias/index.js";
import createHttpError from "http-errors";

const server = Express();
const port = process.env.PORT || 3001;

server.use(Express.json());

const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];
console.log(process.env.FE_DEV_URL);

server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        corsNext(null, true);
      } else {
        corsNext(
          createHttpError(
            400,
            `Origin ${currentOrigin} is not in the whitelist!`
          )
        );
      }
    },
  })
);

server.use("/medias", mediasRouter);

server.listen(port, () => {
  console.table(listEndpoints(server));
  console.log(`Server running on port ${port}`);
});
