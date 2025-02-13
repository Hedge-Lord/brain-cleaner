# Brain Cleaner Backend

This is the backend for the Brain Cleaner MVP project. It is built with Node.js and Express and serves as the entry point for processing PDFs into brainrot videos.

## Overview

- Accepts PDF documents (and potentially other formats) for processing.
- Integrates with external APIs such as Chunkr for document chunking and OpenAI for script generation.
- Provides a REST API endpoint `/api/v1/pdftobrainrot` (name is a work in progress) to initiate the processing of documents.

## Getting Started

1. Install dependencies: `npm install`
2. Start the server: `npm start` (or `node src/app.js` if a custom start script is not defined)

The server will be available on port 3000 by default, or the port specified in your environment variable `PORT`.