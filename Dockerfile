FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

# Use PORT environment variable or default to 8080
EXPOSE 8080

CMD ["python", "app.py"]