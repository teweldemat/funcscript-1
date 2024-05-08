#!/bin/bash
# Navigate to the React project directory
cd ../fsstudio.react

# Install dependencies and build the React project
npm install
npm run build

# Copy the build output to the .NET project's wwwroot directory
cp -R build/ ../fsstudio.server.fileSystem/wwwroot/

# Navigate to the .NET project directory and build it
cd ../fsstudio.server.fileSystem
dotnet publish

# Return to the original directory
cd -
