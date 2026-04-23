# Whisper Speech-to-Text Setup (Free & Deployable)

## 1. Install Python 3.8+
- https://www.python.org/downloads/

## 2. Install ffmpeg
- **Recommended (Windows):**
  - Install [Chocolatey](https://chocolatey.org/install) if not already installed.
  - Then run in PowerShell:
    ```powershell
    choco install ffmpeg -y
    ```
- **Manual:** Download from https://ffmpeg.org/download.html and add ffmpeg to your PATH.

## 3. Install Python dependencies
- In the backend folder, run:
  ```sh
  pip install -r requirements.txt
  ```

## 4. (Optional) For faster transcription, install PyTorch: https://pytorch.org/get-started/locally/

No API keys or paid services required. The backend will call Whisper locally to transcribe audio.

If you have issues, see: https://github.com/openai/whisper
