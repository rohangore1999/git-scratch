const path = require("path");
const zlib = require("zlib");
const fs = require("fs");

class LsTreeCommand {
  constructor(flag, sha) {
    this.flag = flag;
    this.sha = sha;
  }

  execute() {
    const folder = this.sha.slice(0, 2);
    const file = this.sha.slice(2);

    // find the file from <sha>
    const filePath = path.join(process.cwd(), ".git", "objects", folder, file);

    // read file content
    const fileContent = fs.readFileSync(filePath);

    // decompress the file
    const outputBuffer = zlib.inflateSync(fileContent);

    // buffer to string
    const output = outputBuffer.toString();

    const treeContent = output.split("\0").slice(1); // ignoring 1st as it is just "tree and <folder>"

    // cleanup and removing unnecessary files
    const names = treeContent.map((it) => it.split(" ")[1]).filter((el) => el);

    // need on standard output
    names.forEach((name) => process.stdout.write(`${name}\n`));
  }
}

module.exports = LsTreeCommand;
