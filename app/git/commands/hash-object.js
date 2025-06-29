const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const zlib = require("zlib");

class HashOjectCommand {
  constructor(flag, filePath) {
    this.flag = flag;
    this.filePath = filePath;
  }

  execute() {
    // make sure file present
    const filePath = path.resolve(this.filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(
        `could not open ${this.filePath} for reading: No such file or directory`
      );
    }

    // read the file
    const fileContents = fs.readFileSync(filePath);
    const fileLength = fileContents.length;

    // create blob
    const header = `blob ${fileLength}\0`;
    const blob = Buffer.concat([Buffer.from(header), fileContents]);
    // Note: if we directly did this`blob ${fileLength}\0${fileContents}`, js will convert the fileContent to string which may corrupt the binary data.
    // Buffer.concat(): preserves the binary data, \0 will be treated as null byte

    // calc hash
    // create hash of blob using "sha1" and return in "hex" format
    const hash = crypto.createHash("sha1").update(blob).digest("hex");

    // if -w, then write compressed file
    if (this.flag && this.flag === "-w") {
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

      // create file and add compressed data
      fs.writeFileSync(path.join(completeFolderPath, file), compressedData);
    }

    process.stdout.write(hash);
  }
}

module.exports = HashOjectCommand;
