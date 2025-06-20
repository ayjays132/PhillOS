import sys
from transformers import pipeline
from flask import Flask, request, jsonify
import os
import tempfile

app = Flask(__name__)
transcriber = pipeline('automatic-speech-recognition', 'openai/whisper-small')

@app.route('/transcribe', methods=['POST'])
def transcribe_route():
    file = request.files.get('file')
    if not file:
        return jsonify({'text': ''})
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        file.save(tmp)
        tmp.close()
        result = transcriber(tmp.name)
        text = result if isinstance(result, str) else result.get('text', '')
    os.unlink(tmp.name)
    return jsonify({'text': text})

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'serve':
        app.run(host='127.0.0.1', port=8765)
    else:
        path = sys.argv[1] if len(sys.argv) > 1 else ''
        out = transcriber(path)
        text = out if isinstance(out, str) else out.get('text', '')
        print(text)
