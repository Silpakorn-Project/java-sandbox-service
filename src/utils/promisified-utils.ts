import { exec as origExec } from "child_process";
import {
    promises as fs,
    readFile as origReadFile,
    unlink as origUnlink,
    writeFile as origWriteFile,
} from "fs";
import { promisify } from "util";

export const exec = promisify(origExec);
export const readFile = promisify(origReadFile);
export const unlink = promisify(origUnlink);
export const writeFile = promisify(origWriteFile);
export const fileSystem = fs;
