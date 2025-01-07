import { exec as origExec } from "child_process";
import { join, resolve } from "path";
import { promisify } from "util";
import { extract } from "./utils/file_extractor";

const exec = promisify(origExec);
// const readFile = promisify(origReadFile);
// const unlink = promisify(origUnlink);

export async function runTests(path: string, id: string) {
  const outputPath = join("work", id);
  await extract(path, outputPath);

  const containerId = `submission-${id}`;

  try {
    await exec(`chmod -R 777 ${outputPath}`);

    const command = `docker create --name ${containerId} --workdir /app --volume ${resolve(
      outputPath
    )}:/app my-openjdk tail -f /dev/null`;

    console.log(`Creating a container with '${command}'`);
    await exec(command);

    console.log(`Starting the container '${containerId}' and running tests`);
    await exec(`docker start ${containerId}`);

    const listTestsCommand = `docker exec submission-${id} find /app/src/test/java -name "*Test.java"`;
    const { stdout: testFiles } = await exec(listTestsCommand);
    const testFilesArray = testFiles.split("\n").filter((file) => file);

    if (testFilesArray.length === 0) {
      throw new Error("No test files found in the directory.");
    }

    const testCommand = `docker exec ${containerId} mvn -f /app/pom.xml test`;

    console.log(`Running tests with command: ${testCommand}`);
    const { stdout: testResults, stderr: testErrors } = await exec(testCommand);

    if (testErrors) {
      console.error(`Test execution errors: ${testErrors}`);
    }else {
      console.log("Test Results:\n", testResults);
    }
  } catch (e) {
    throw e;
  } finally {
    console.log(`Removing the container '${containerId}'`);
    const removeCommand = `docker rm -f ${containerId}`;
    await exec(`docker commit ${containerId} my-maven-cached`)
    await exec(removeCommand);
  }
}
