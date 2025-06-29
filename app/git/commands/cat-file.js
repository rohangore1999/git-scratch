const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

class CatFileCommand {
  constructor(flag, commitSHA) {
    // storing in --> this.flag, this.commitSHA
    this.flag = flag;
    this.commitSHA = commitSHA;
  }

  execute() {
    // Steps:-
    // Navigate to .git/objects/commitSHA take [0,2]
    // Read the file .git/objects/commitSHA[0,2]/commitSHA[2,..]
    // decompress the file
    // log

    const flag = this.flag;
    const commitSHA = this.commitSHA;

    switch (flag) {
      case "-p":
        // taking folder
        const folder = commitSHA.slice(0, 2);
        const file = commitSHA.slice(2);

        const completePath = path.join(
          process.cwd(), // starts form cur working dir
          ".git", // goto .git
          "objects", // goto .objects
          folder, // goto folder
          file // goto file
        );

        if (!fs.existsSync(completePath)) {
          // path doest exist throw error
          throw new Error(`Not a valid object name ${commitSHA}`);
        }

        // read file content
        const fileContent = fs.readFileSync(completePath);

        // decompress the file
        const outputBuffer = zlib.inflateSync(fileContent);

        // buffer to string
        const output = outputBuffer.toString();

        // need on standard output
        process.stdout.write(output);

        break;
    }
  }
}

module.exports = CatFileCommand;
