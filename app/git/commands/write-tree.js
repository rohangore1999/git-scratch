const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const zlib = require("zlib");

function writeFileBlob(currentPath) {
  // Same as hash-object: eg -> currentPath got package.json, we have to compress the content and create hash of the file and write in .git/objects/sha[0,2]/<file> i.e(sha[2])

  // read file content
  const contents = fs.readFileSync(currentPath);
  const contentLength = contents.length;

  // create blob
  const header = `blob ${contentLength}\0`;
  const blob = Buffer.concat([Buffer.from(header), contents]);

  // calc hash
  // create hash of blob using "sha1" and return in "hex" format
  const hash = crypto.createHash("sha1").update(blob).digest("hex");

  // write the compressed file
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

  // compress the file using zlib and add into completeFolderPath
  const compressedData = zlib.deflateSync(blob);

  // create file with compressedData and add into completeFolderPath
  const objectPath = path.join(completeFolderPath, file);

  if (!fs.existsSync(objectPath)) {
    fs.writeFileSync(objectPath, compressedData);
  }

  // return the hash (sha code)
  return hash;
}

class WriteTreeCommand {
  constructor() {}

  execute() {
    // recursive read all files/folders
    function recursiveCreateTree(basePath) {
      const dirContents = fs.readdirSync(basePath);

      // dirContents: [
      //   '.git',
      //   '.gitignore',
      //   'README.md',
      //   'app',
      //   'package-lock.json',
      //   'package.json',
      //   'test-dir'
      // ]
      console.log({ dirContents });

      const result = [];
      // loop over each folders/files
      for (const dirContent of dirContents) {
        // ignore .git folder -> as we dont want to track it
        if (dirContent.includes(".git")) continue;

        // to check if dirContnent contains file/folder
        const currentPath = path.join(basePath, dirContent);
        const stat = fs.statSync(currentPath);

        if (stat.isDirectory()) {
          // call recursively with current path
          // this sha will be "tree" hash as its a dir
          const sha = recursiveCreateTree(currentPath);

          if (sha) {
            result.push(
              // mode -> folder
              // baseName -> name of the folder
              // hash
              { mode: "40000", basename: path.basename(currentPath), sha }
            );
          }
        } else if (stat.isFile()) {
          // if file then write
          const sha = writeFileBlob(currentPath);

          // storing in result, as we need to store in default git tree structure:
          // tree <size>\0
          // <mode> <name>\0<sha>
          // <mode> <name>\0<sha>

          result.push(
            // mode -> file
            // baseName -> name of the file
            // hash
            { mode: "100644", basename: path.basename(currentPath), sha }
          );
        }
      }

      // after completing inner child via recursion, at the end create tree for outer

      // ignoring empty dir/folder
      if (dirContents.length === 0 || result.length == 0) return null;

      // tree <size>\0
      // <mode> <name>\0<sha>
      // <mode> <name>\0<sha>
      const treeData = result.reduce((acc, current) => {
        const { mode, basename, sha } = current;

        return Buffer.concat([
          acc,
          Buffer.from(`${mode} ${basename}\0`), // <mode> <name>\0
          Buffer.from(sha, "hex"), // <sha>
        ]);
      }, Buffer.alloc(0));

      // create a final tree data
      const tree = Buffer.concat([
        Buffer.from(`tree ${treeData.length}\0`), // tree <size>\0
        treeData, // <mode> <name>\0<sha>
      ]);

      // hash the final tree data (same as writeFileBlob)
      const hash = crypto.createHash("sha1").update(tree).digest("hex");

      // write the hash
      const folder = hash.slice(0, 2);
      const file = hash.slice(2);

      const treeFolderPath = path.join(
        process.cwd(),
        ".git",
        "objects",
        folder
      );

      if (!fs.existsSync(treeFolderPath)) {
        // if the folder does not exist, create it
        fs.mkdirSync(treeFolderPath);
      }

      // compress the tree data using zlib and add into treeFolderPath
      const compressedData = zlib.deflateSync(tree);

      const objectPath = path.join(treeFolderPath, file);

      if (!fs.existsSync(objectPath)) {
        fs.writeFileSync(objectPath, compressedData);
      }

      return hash;
    }

    const sha = recursiveCreateTree(process.cwd()); // starts with current working dir

    process.stdout.write(sha);
  }
}

module.exports = WriteTreeCommand;
