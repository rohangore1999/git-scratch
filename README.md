GIT from Scratch - nodejs 🏗️ WIP

ref ~ https://blog.meain.io/2023/what-is-in-dot-git/
git 
ref ~ https://github.com/codecrafters-io/build-your-own-git/tree/main/starter_templates/javascript/code

## 📖 Overview

This project is a Node.js implementation of core Git functionality, built from scratch to understand the internal workings of Git. It demonstrates how Git stores and manages data at a fundamental level, including object storage, hashing, and compression mechanisms.

## 🎯 Learning Objectives

- **Understand Git Internals**: Learn how Git stores objects, calculates hashes, and manages the `.git` directory structure
- **Binary Data Handling**: Explore why and how Git handles binary data safely using Node.js Buffers
- **Object Storage**: Implement Git's object storage system with proper compression and directory structure
- **Command Line Interface**: Build a CLI that mimics Git's command structure and behavior

## 🛠️ Implemented Commands

### `git init`

Initializes a new Git repository by creating the `.git` directory structure:

```
.git/
├── objects/     # Stores all Git objects (blobs, trees, commits)
├── refs/        # Stores references (branches, tags)
└── HEAD         # Points to current branch reference
```

### `git cat-file -p <hash>`

Reads and displays Git objects by their SHA-1 hash:

- Locates object file in `.git/objects/<first-2-chars>/<remaining-38-chars>`
- Decompresses the zlib-compressed object data
- Parses the object header and content
- Displays the original file content

### `git hash-object [flags] <file>`

Creates Git blob objects from files:

- **Without `-w`**: Calculates and displays the SHA-1 hash of the file
- **With `-w`**: Additionally stores the compressed object in `.git/objects/`

**Usage Examples:**

```bash
node app/main.js hash-object package.json           # Display hash only
node app/main.js hash-object -w package.json        # Store object and display hash
```

## 🔍 Technical Deep Dive

### Git Object Format

Git objects follow a specific binary format:

```
<object-type> <content-length>\0<content>
```

For blobs (file objects):

```
blob <file-size>\0<file-content>
```

### Binary Data Handling: Why Buffers Matter

A critical aspect of Git implementation is proper binary data handling. Here's why we use `Buffer.concat()` instead of string concatenation:

**❌ Wrong Approach:**

```javascript
`blob ${fileLength}\0${fileContents}`; // DON'T DO THIS!
```

**✅ Correct Approach:**

```javascript
const header = `blob ${fileLength}\0`;
const blob = Buffer.concat([Buffer.from(header), fileContents]);
```

**Why the difference matters:**

1. **Binary Data Integrity**: Files can contain binary data (images, executables, etc.). String concatenation would:

   - Convert binary data to UTF-8 strings
   - Replace invalid UTF-8 sequences with replacement characters ()
   - Corrupt the original data permanently

2. **Null Byte Handling**: The `\0` separator must be a literal null byte (byte value 0), not the string characters '\' and '0'

3. **Git Compatibility**: Git expects exact binary format - any corruption makes objects unreadable

### Object Storage Process

1. **Read File**: `fs.readFileSync()` returns raw binary data as Buffer
2. **Create Header**: Format blob header with size and null terminator
3. **Combine Data**: Use `Buffer.concat()` to merge header and content safely
4. **Calculate Hash**: SHA-1 hash of the complete blob data
5. **Compress**: Use zlib deflate compression
6. **Store**: Save in `.git/objects/<hash[0:2]>/<hash[2:]>` structure

### Directory Structure

```
git-scratch/
├── app/
│   ├── git/
│   │   ├── client.js              # Git client orchestrator
│   │   └── commands/
│   │       ├── index.js           # Command exports
│   │       ├── cat-file.js        # Object reading implementation
│   │       └── hash-object.js     # Object creation implementation
│   └── main.js                    # CLI entry point and argument parsing
├── package.json
└── README.md
```

## 🧪 Testing Your Implementation

Create a test file and verify the implementation:

```bash
# Initialize repository
node app/main.js init

# Create a test file
echo "Hello, Git!" > test.txt

# Hash the file (display only)
node app/main.js hash-object test.txt

# Hash and store the file
node app/main.js hash-object -w test.txt

# Read the stored object back
node app/main.js cat-file -p <hash-from-previous-command>
```

Compare with real Git:

```bash
# Real Git commands for comparison
git init
git hash-object test.txt
git hash-object -w test.txt
git cat-file -p <hash>
```

The hashes should match exactly if implementation is correct!

## 🎓 Key Learnings

- **Git is fundamentally a content-addressable filesystem** where every object is identified by its SHA-1 hash
- **Binary data safety is crucial** - improper handling corrupts data and breaks Git compatibility
- **Compression and efficient storage** - Git uses zlib compression to minimize storage space
- **Simple but powerful design** - Complex Git features are built on these fundamental object operations

## 🚀 Next Steps

Future enhancements could include:

- Tree objects (directory structures)
- Commit objects (snapshots with metadata)
- Branch and tag management
- Merge and diff algorithms
- Remote repository operations

## 📚 Resources

The implementation references and learning materials used in this project provide excellent deep-dives into Git internals and object storage mechanisms.
