# Brain Cleaner Backend

## Setup

For installation and configuration instructions, please see [docs/setup.md](docs/setup.md).

## Overview

- Accepts PDF documents (and potentially other formats) for processing.
- Integrates with external APIs such as Chunkr for document chunking and OpenAI for script generation.
- Provides a REST API endpoint `/api/v1/pdftobrainrot` (name is a work in progress) to initiate the processing of documents.