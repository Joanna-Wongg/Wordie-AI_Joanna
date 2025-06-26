set FLASK_SECRET_KEY=test
set OPENAI_API_KEY=
set researcher_username=1
set researcher_password=1

#fcntl module is not available on Windows
pip install waitress
waitress-serve --listen=0.0.0.0:8000 wordie:app

http://localhost:8000/