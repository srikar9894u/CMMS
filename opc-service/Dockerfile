FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy OPC service code
COPY opc_service_v2.py .

# Create volume for database
VOLUME ["/data"]

# Set environment variable for database path
ENV DB_PATH=/data/database.sqlite

# Run the OPC service
CMD ["python", "-u", "opc_service_v2.py"]
