import { createReadStream } from "fs";
import * as tar from "tar-fs";

export const extract = (
    inputPath: string,
    outputPath: string,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const extractStream = createReadStream(inputPath).pipe(
            tar.extract(outputPath),
        );
        extractStream.on("finish", () => {
            console.log("finished");
            resolve();
        });
        extractStream.on("error", (reason) => {
            reject(reason);
        });
    });
};
