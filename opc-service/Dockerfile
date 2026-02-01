FROM python:3.14-slim

WORKDIR /app

# Install system dependencies including snap7 build tools
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download and install snap7 library from official repository
# Repository: https://github.com/davenardella/snap7
RUN curl -L -o snap7.tar.gz https://github.com/davenardella/snap7/archive/refs/heads/main.tar.gz \
    && tar -xzf snap7.tar.gz \
    && cd snap7-main/build/linux \
    && make all \
    && cp ../bin/linux/libsnap7.so /usr/lib/ \
    && ldconfig \
    && cd /app \
    && rm -rf snap7-main snap7.tar.gz

# Copy requirements files
COPY requirements.txt .
COPY requirements-s7.txt .

# Install Python dependencies (OPC UA and S7)
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r requirements-s7.txt

# Copy service code
COPY opc_service_v2.py .
COPY s7_service.py .
COPY start_services.sh .

# Make startup script executable
RUN chmod +x start_services.sh

# Create volume for database
VOLUME ["/data"]

# Set environment variable for database path
ENV DB_PATH=/data/database.sqlite

# Run both OPC and S7 services
CMD ["./start_services.sh"]
