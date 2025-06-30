# Git from Scratch - Node.js Implementation 🏗️

#### References

- What is .git ~ https://blog.meain.io/2023/what-is-in-dot-git/
- Github ~ https://github.com/codecrafters-io/build-your-own-git/tree/main/starter_templates/javascript/code

## 📖 Overview

This project is a comprehensive Node.js implementation of core Git functionality, built from scratch to understand the internal workings of Git. It demonstrates how Git stores and manages data at a fundamental level, including object storage, hashing, compression, and the complete lifecycle of Git objects from files to commits.

## 🎯 Learning Objectives

- **Understand Git Internals**: Learn how Git stores objects, calculates hashes, and manages the `.git` directory structure
- **Binary Data Handling**: Master safe binary data operations using Node.js Buffers
- **Object Storage System**: Implement Git's complete object storage with compression and proper directory structure
- **Git Object Types**: Work with all Git object types: blobs, trees, and commits
- **Command Line Interface**: Build a CLI that accurately mimics Git's command structure and behavior

## 🛠️ Implemented Commands

### 1. `git init`

**Purpose**: Initialize a new Git repository

**Approach**:

- Creates the complete `.git` directory structure
- Uses `fs.mkdirSync()` with `recursive: true` to ensure all parent directories are created
- Sets up the initial HEAD reference pointing to `refs/heads/main`

**Directory Structure Created**:

```
.git/
├── objects/     # Stores all Git objects (blobs, trees, commits)
├── refs/        # Stores references (branches, tags)
└── HEAD         # Points to current branch reference
```

**Usage**:

```bash
node app/main.js init
```

---

### 2. `git hash-object [flags] <file>`

**Purpose**: Create Git blob objects from files and optionally store them

**Technical Approach**:

1. **File Reading**: Use `fs.readFileSync()` to read file as Buffer (preserves binary data)
2. **Blob Creation**: Create Git blob format: `blob <size>\0<content>`
3. **Binary Safety**: Use `Buffer.concat()` to safely combine header and content
4. **Hash Generation**: Calculate SHA-1 hash of the complete blob
5. **Optional Storage**: With `-w` flag, compress and store in `.git/objects/`

**Critical Implementation Details**:

- **Why Buffer.concat()**: Prevents binary data corruption that would occur with string concatenation
- **Null Byte Handling**: The `\0` must be a literal null byte (0x00), not string characters
- **Object Storage**: First 2 chars of hash = folder, remaining 38 chars = filename

**Usage**:

```bash
node app/main.js hash-object package.json           # Display hash only
node app/main.js hash-object -w package.json        # Store object and display hash
```

---

### 3. `git cat-file -p <hash>`

**Purpose**: Read and display Git objects by their SHA-1 hash

**Technical Approach**:

1. **Object Location**: Split hash into folder (first 2 chars) and file (remaining 38 chars)
2. **Path Construction**: Navigate to `.git/objects/<folder>/<file>`
3. **Decompression**: Use `zlib.inflateSync()` to decompress the stored object
4. **Content Extraction**: Parse the decompressed data and extract the original content
5. **Output**: Display the original file content to stdout

**Error Handling**:

- Validates object existence before attempting to read
- Provides meaningful error messages for invalid object names

**Usage**:

```bash
node app/main.js cat-file -p a1b2c3d4...  # Display object content
```

---

### 4. `git ls-tree [--name-only] <tree-hash>`

**Purpose**: List the contents of a Git tree object

**Technical Approach**:

1. **Tree Object Reading**: Same decompression process as cat-file
2. **Content Parsing**: Split tree content by null bytes (`\0`)
3. **Entry Extraction**: Parse each entry format: `<mode> <name>\0<sha>`
4. **Name Filtering**: Extract just the filenames from each entry
5. **Output Formatting**: Display each name on a separate line

**Tree Object Format**:

```
tree <size>\0
<mode> <name>\0<sha-bytes>
<mode> <name>\0<sha-bytes>
...
```

**Usage**:

```bash
node app/main.js ls-tree a1b2c3d4...              # List tree contents
node app/main.js ls-tree --name-only a1b2c3d4...  # Names only (same behavior)
```

---

### 5. `git write-tree`

**Purpose**: Create tree objects representing the current directory structure

**Technical Approach**:

1. **Recursive Directory Traversal**: Start from current working directory
2. **Content Classification**: Identify files vs directories using `fs.statSync()`
3. **File Processing**: Convert files to blobs using the same logic as hash-object
4. **Directory Processing**: Recursively process subdirectories to create sub-trees
5. **Tree Construction**: Build tree object with proper Git format
6. **Object Storage**: Compress and store the tree object

**Recursive Algorithm**:

```javascript
function recursiveCreateTree(basePath) {
  // Read directory contents
  // For each item:
  //   - If file: create blob, add to result
  //   - If directory: recursively create tree, add to result
  // Create tree object from collected results
  // Return tree hash
}
```

**Git Tree Format**:

- File entries: `100644 <filename>\0<sha-bytes>`
- Directory entries: `40000 <dirname>\0<sha-bytes>`

**Special Handling**:

- Ignores `.git` directory to prevent infinite recursion
- Skips empty directories (returns null)
- Checks for existing objects before writing (prevents permission errors)

**Usage**:

```bash
node app/main.js write-tree
```

---

### 6. `git commit-tree <tree-sha> -p <parent-sha> -m <message>`

**Purpose**: Create commit objects that reference tree objects

**Technical Approach**:

1. **Commit Object Construction**: Build commit content with all required fields
2. **Metadata Addition**: Add author/committer info with timestamps
3. **Content Assembly**: Combine tree reference, parent reference, and message
4. **Object Creation**: Follow same pattern as other objects (header + content)
5. **Storage**: Compress and store in `.git/objects/`

**Commit Object Format**:

```
commit <size>\0
tree <tree-sha>
parent <parent-sha>
author <name> <email> <timestamp> <timezone>
committer <name> <email> <timestamp> <timezone>

<commit-message>
```

**Implementation Details**:

- Uses current timestamp (`Date.now()`)
- Hardcoded author/committer info (can be made configurable)
- Timezone set to `+0000` (UTC)

**Usage**:

```bash
node app/main.js commit-tree <tree-sha> -p <parent-sha> -m "commit message"
```

## 🧠 Technical Deep Dive

### Binary Data Handling: The Critical Difference

**❌ Wrong Approach (Data Corruption)**:

```javascript
const content = `blob ${fileLength}\0${fileContents}`;
```

**✅ Correct Approach (Data Integrity)**:

```javascript
const header = `blob ${fileLength}\0`;
const blob = Buffer.concat([Buffer.from(header), fileContents]);
```

**Why This Matters**:

1. **Binary Files**: Images, executables, compiled code contain non-UTF8 bytes
2. **String Conversion**: JavaScript strings are UTF-16, conversion corrupts binary data
3. **Null Bytes**: Git format requires literal null bytes (0x00), not string "\0"
4. **Hash Accuracy**: Any corruption changes the SHA-1 hash, breaking Git compatibility

### Object Storage Architecture

**Directory Structure**:

```
.git/objects/
├── ab/
│   └── cdef123456789...    # Object file (compressed)
├── 12/
│   └── 3456789abcdef...    # Another object
└── ...
```

**Storage Process**:

1. Calculate SHA-1 hash of object
2. First 2 hex chars = subdirectory name
3. Remaining 38 hex chars = filename
4. Compress object data with zlib
5. Write compressed data to file

### Error Handling Patterns

**Permission Issues**: Objects are read-only once created

```javascript
const objectPath = path.join(completeFolderPath, file);
if (!fs.existsSync(objectPath)) {
  fs.writeFileSync(objectPath, compressedData);
}
```

**File Validation**: Always check file existence

```javascript
if (!fs.existsSync(filePath)) {
  throw new Error(`could not open ${filePath} for reading`);
}
```

## 🧪 Testing Your Implementation

### Complete Workflow Test

```bash
# 1. Initialize repository
node app/main.js init

# 2. Create test files
echo "Hello, Git!" > test.txt
echo "# My Project" > README.md

# 3. Hash individual files
node app/main.js hash-object -w test.txt
node app/main.js hash-object -w README.md

# 4. Create tree from current directory
TREE_HASH=$(node app/main.js write-tree)
echo "Tree hash: $TREE_HASH"

# 5. List tree contents
node app/main.js ls-tree $TREE_HASH

# 6. Read specific objects
node app/main.js cat-file -p $TREE_HASH

# 7. Create a commit (if you have a parent commit)
# node app/main.js commit-tree $TREE_HASH -p $PARENT_HASH -m "Initial commit"
```

### Verification Against Real Git

```bash
# Compare hashes with real Git
git init
git add test.txt
git hash-object test.txt                    # Should match your implementation
git write-tree                             # Should match your implementation
git ls-tree HEAD                           # Compare structure
```

## 📁 Project Structure

```
git-scratch/
├── app/
│   ├── git/
│   │   ├── client.js              # Git client orchestrator
│   │   └── commands/
│   │       ├── index.js           # Command exports
│   │       ├── cat-file.js        # Object reading
│   │       ├── hash-object.js     # Blob creation
│   │       ├── ls-tree.js         # Tree listing
│   │       ├── write-tree.js      # Tree creation
│   │       └── commit-tree.js     # Commit creation
│   └── main.js                    # CLI entry point
├── package.json
├── package-lock.json
└── README.md
```

## 🎓 Key Learnings & Insights

### 1. **Git's Elegant Design**

- Everything is content-addressable (hash = identity)
- Simple object types (blob, tree, commit) compose into complex functionality
- Immutable objects enable safe concurrent operations

### 2. **Binary Data Mastery**

- Buffer operations are essential for system-level programming
- String concatenation is dangerous with binary data
- Proper null byte handling requires understanding of byte vs. character encoding

### 3. **Recursive Algorithms**

- File system traversal mirrors Git's tree structure
- Depth-first processing ensures proper dependency order
- Base cases (empty directories) prevent infinite recursion

### 4. **Error Handling Strategies**

- Permission errors indicate normal Git behavior (read-only objects)
- Path validation prevents runtime crashes
- Meaningful error messages improve debugging experience

### 5. **Performance Considerations**

- Object deduplication (same content = same hash) saves space
- Compression reduces storage overhead significantly
- Synchronous operations acceptable for CLI tools
