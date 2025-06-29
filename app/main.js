const fs = require("fs");
const path = require("path");

const GitClient = require("./git/client");

// Commands
const { CatFileCommand, HashOjectCommand } = require("./git/commands");

const gitClient = new GitClient();

const command = process.argv[2];

switch (command) {
  case "init":
    createGitDirectory();
    break;

  case "cat-file":
    handleCatFileCommand();
    break;

  case "hash-object":
    handleHashObjectCommand();
    break;

  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(
    path.join(process.cwd(), ".git", "HEAD"),
    "ref: refs/heads/main\n"
  );
  console.log("Initialized git directory");
}

function handleCatFileCommand() {
  // eg: command --> git cat-file -p <filename>

  const flag = process.argv[3];
  const commitSHA = process.argv[4];

  const command = new CatFileCommand(flag, commitSHA);
  gitClient.run(command);
}

function handleHashObjectCommand() {
  // eg: command --> git hash-object package.json [just log the hash]
  // eg: command --> git hash-object -w package.json [store the file object/hash[0,2]/hash[2,..]]

  let flag = process.argv[3];
  let filePath = process.argv[4];

  if (!filePath) {
    // user can pass '-w' or not (optional)
    filePath = flag;
    flag = null;
  }

  console.log({ flag, filePath });

  const command = new HashOjectCommand(flag, filePath);

  gitClient.run(command);
}
