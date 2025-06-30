const fs = require("fs");
const path = require("path");

const GitClient = require("./git/client");

// Commands
const {
  CatFileCommand,
  HashOjectCommand,
  LsTreeCommand,
  WriteTreeCommand,
  CommitTreeCommand,
} = require("./git/commands");

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

  case "ls-tree":
    handleLsTreeCommand();
    break;

  case "write-tree":
    handleWriteTreeCommand();
    break;

  case "commit-tree":
    handleCommitTreeCommand();
    break;

  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  //  { recursive: true } --> to create all missing directories if the are missing
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

function handleLsTreeCommand() {
  // eg: command --> git ls-tree <hash>
  // eg: command --> git ls-tree --name-only <hash>

  let flag = process.argv[3];
  let sha = process.argv[4];

  if (!sha) {
    // user can pass '--name-only' or not (optional)
    sha = flag;
    flag = null;
  }

  const command = new LsTreeCommand(flag, sha);

  gitClient.run(command);
}

function handleWriteTreeCommand() {
  // eg: command --> git write-tree // output: it will create hash of current working dir file/folder and store in .git/objects

  const command = new WriteTreeCommand();

  gitClient.run(command);
}

function handleCommitTreeCommand() {
  // eg git commit-tree 1234<hash> -m<flag> <commit_msg>
  // input: git commit-tree <tree_sha> -p <commit_sha> -m <message>
  let treeSHA = process.argv[3];
  let commitSHA = process.argv[5];
  let commitMessage = process.argv[7];

  const command = new CommitTreeCommand(treeSHA, commitSHA, commitMessage);

  gitClient.run(command);
}
