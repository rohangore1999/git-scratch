const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const zlib = require("zlib");

class CommitTreeCommand {
  constructor(treeSHA, commitSHA, commitMessage) {
    this.treeSHA = treeSHA;
    this.commitSHA = commitSHA;
    this.commitMessage = commitMessage;
  }

  execute() {
    // below file we have to create:-
    // tree 63071b00a1cfea73599e51ce1a2e4d9c484c95ac <treeSHA>
    // parent 2343a5c423b59dbae7222acf9f5b7a8520be710c <commitSHA>
    // author Rohan Gore <gorerohan15@gmail.com> 1751200678 +0530 <any default email>
    // committer Rohan Gore <gorerohan15@gmail.com> 1751200678 +0530 <any default email>

    // added ls-tree <commitMessage>

    const contentBuffer = Buffer.concat([
      Buffer.from(`tree ${this.treeSHA}\n`),
      Buffer.from(`parent ${this.commitSHA}\n`),
      Buffer.from(
        `author Rohan Gore <gorerohan15@gmail.com> ${Date.now()} +0000\n`
      ),
      Buffer.from(
        `committer Rohan Gore <gorerohan15@gmail.com> ${Date.now()} +0000\n\n`
      ),
      Buffer.from(`${this.commitMessage}`),
    ]);

    // create hash of contentBuffer and add to `.git/objects` dir
    const header = `commit ${contentBuffer.length}\0`;
    const blob = Buffer.concat([Buffer.from(header), contentBuffer]);

    const hash = crypto.createHash("sha1").update(blob).digest("hex");

    const folder = hash.slice(0, 2);
    const file = hash.slice(2);

    const completeFolderPath = path.join(
      process.cwd(),
      ".git",
      "objects",
      folder
    );

    if (!fs.existsSync(completeFolderPath)) {
      // if the folder does not exist, create it
      fs.mkdirSync(completeFolderPath);
    }

    // compress file (using zlib) and write
    const compressedData = zlib.deflateSync(blob);

    // create file with compressedData and add into completeFolderPath
    fs.writeFileSync(path.join(completeFolderPath, file), compressedData);

    process.stdout.write(hash);
  }
}

module.exports = CommitTreeCommand;
