import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const mediasSchema = {
  title: {
    in: ["body"],
    isString: {
      errorMessage: "Title is a mandatory field and needs to be a string!",
    },
  },
  year: {
    in: ["body"],
    isString: {
      errorMessage: "Year is a mandatory field and needs to be a string!",
    },
  },
  type: {
    in: ["body"],
    isString: {
      errorMessage: "The Type is a mandatory field and needs to be a string!",
    },
  },

  }


export const checkMediasSchema = checkSchema(mediasSchema);

export const triggerBadRequest = (req, res, next) => {

  const errors = validationResult(req);

  console.log(errors.array());

  if (errors.isEmpty()) {

    next();
  } else {
    next(
      createHttpError(400, "You did something wrong..", {
        errorsList: errors.array(),
      })
    );
  }
};
