const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Create output directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join('dist', 'fflag-bot.zip'));
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
    console.log(`📦 Archive created successfully! Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

// Good practice to catch warnings
archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
    } else {
        throw err;
    }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Create .env.example first
const envExample = `# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
OWNER_ID=your_discord_id_here

# Optional Configuration
GITHUB_API_BASE=https://api.example.com/fflag
`;

fs.writeFileSync('.env.example', envExample);

// Files to include in the zip
const filesToInclude = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'README.md',
    '.env.example',
    '.gitignore'
];

// Directories to include
const foldersToInclude = [
    'bot',
    'scripts'
];

// Add individual files
filesToInclude.forEach(file => {
    if (fs.existsSync(file)) {
        archive.file(file, { name: file });
    }
});

// Add directories
foldersToInclude.forEach(folder => {
    if (fs.existsSync(folder)) {
        archive.directory(folder, folder);
    }
});

// Add installation instructions
const installInstructions = `
Installation Instructions:
------------------------

1. Extract the zip file
2. Copy .env.example to .env and update with your bot token and owner ID
3. Run the following commands:

   npm install
   npm run build
   npm start

For development:
   npm run bot:dev

For more details, see README.md
`;

archive.append(installInstructions, { name: 'INSTALL.txt' });

// Finalize the archive
archive.finalize();
