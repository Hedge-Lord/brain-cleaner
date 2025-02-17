import requests
import json

# Replace this with your actual local file path
file_path = '/Users/ritesh/Downloads/specs.pdf'

# The URL of your local API endpoint
url = "http://localhost:3000/api/v1/pdftobrainrot/"

# Open the file in binary mode and send it in the request
with open(file_path, 'rb') as f:
    files = {
        'file': (file_path.split('/')[-1], f, 'application/pdf')  # Send only the file name and file content
    }
    data = {
        'file_name': file_path.split('/')[-1]  # Extract the file name from the path
    }
    
    # Sending the POST request to the API
    response = requests.post(url, files=files, data=data)

# Print the response from the API
if response.status_code == 200:
    print('Success:', response.json())
else:
    print('Error:', response.status_code, response.text)
