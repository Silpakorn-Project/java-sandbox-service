import { exec as origExec } from "child_process";
import { join } from "path";
import { promisify } from "util";
import { extract } from "./utils/file_extractor";

const exec = promisify(origExec);
// const readFile = promisify(origReadFile);
// const unlink = promisify(origUnlink);

export async function runTests(path: string, id: string) {
  const outputPath = join("work", id);
  await extract(path, outputPath);

  const containerName = `submission-${id}`;
  const volumePath =  `/app/${id}`;

  try {
    await exec(`chmod -R 777 ${outputPath}`);

    // FIX: don't use hard code volume name "java-sandbox_submissions:/app"
    // FIX: don't use hard code image name "my-openjdk" 
    const command = `docker create --name ${containerName} --workdir /app --volume java-sandbox_submissions:/app my-openjdk tail -f /dev/null`;

    console.log(`Creating a container with '${command}'`);
    await exec(command);

    console.log(`Starting the container '${containerName}' and running tests`);
    await exec(`docker start ${containerName}`);

    const listTestsCommand = `docker exec submission-${id} find ${volumePath}/src/test/java -name "*Test.java"`;
    const { stdout: testFiles } = await exec(listTestsCommand);
    const testFilesArray = testFiles.split("\n").filter((file) => file);

    if (testFilesArray.length === 0) {
      throw new Error("No test files found in the directory.");
    }

    const testCommand = `docker exec ${containerName} mvn -f ${volumePath}/pom.xml test`;

    console.log(`Running tests with command: ${testCommand}`);
    const { stdout: testResults, stderr: testErrors } = await exec(testCommand);

    if (testErrors) {
      console.error(`Test execution errors: ${testErrors}`);
    }

    console.log("Test Results:\n", testResults);
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    console.log(`Removing the container '${containerName}'`);
    const removeCommand = `docker rm -f ${containerName}`;
    await exec(removeCommand);
  }
}
