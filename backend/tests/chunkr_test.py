import os
from dotenv import load_dotenv
from chunkr_ai import Chunkr

load_dotenv()

# Initialize the Chunkr client with your API key - get this from https://chunkr.ai
CHUNKR_API_KEY = os.getenv("CHUNKR_API_KEY")
chunkr = Chunkr(api_key=CHUNKR_API_KEY)

# Upload a document via url or local file path
url = "/Users/ritesh/Downloads/specs_chunkr.pdf" #can be a url or local file path
task = chunkr.upload(url)

# Export result as JSON
task.json(output_file="output.json")


# The output of the task is a list of chunks
chunks = task.output.chunks

# Each chunk is a list of segments
for chunk in chunks:
    print("NEW CHUNK:")
    for segment in chunk.segments:
        print(segment)
        print()

chunkr.close()
