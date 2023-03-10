import fs from "fs-extra"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
const { readJSON, writeJSON } = fs

const mediasPath = join(dirname(fileURLToPath(import.meta.url)), "../API/medias")
const mediasJSONPath = join(mediasPath, "medias.json")

export const getMedias = () => readJSON(mediasJSONPath)
export const writeMedias = mediasArray => writeJSON(mediasJSONPath, mediasArray)