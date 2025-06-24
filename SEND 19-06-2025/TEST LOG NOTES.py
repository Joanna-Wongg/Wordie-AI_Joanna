#Install Flask on cmd
pip install flask

#Install reticulate and PNG on RStudio
install.packages("reticulate")
library(reticulate)

#On cmd
C:\Users\joann\Documents\GitHub\Wordie-AI
py wordie.py
#ModuleNotFoundError: No module named 'openai'
pip install openai

#cmd 2
py wordie.py
ModuleNotFoundError: No module named 'anthropic'
#Error: No module named 'anthropic'

pip install google
#ModuleNotFoundError: No module named 'google'
pip install --upgrade google-api-python-client

#Error: No module named 'google.generativeai'
pip install google.generativeai

#ModuleNotFoundError: No module named 'dotenv'

#on cmd
pip install -r requirements.txt

#ModuleNotFoundError: No module named 'dotenv'
pip install dotenv

import dotenv
from pathlib import Path
env_file_path = Path(r"C:\Users\joann\Documents\GitHub\Wordie-AI\TEST.env")
env_file_path.touch
dotenv.set_key(dotenv_path=env_file_path, key_to_set="FLASK_SECRET_KEY", value_to_set="envtest")
load_dotenv(r"C:\Users\joann\Documents\GitHub\Wordie-AI\TEST.env")


set FLASK_SECRET_KEY=testt
set OPENAI_API_KEY=
set researcher_username=1
set researcher_password=1

cd C:\Users\joann\Documents\GitHub\Wordie-AI
#fcntl module is not available on Windows
pip install waitress
waitress-serve --listen=0.0.0.0:8000 wordie:app

http://localhost:8000/