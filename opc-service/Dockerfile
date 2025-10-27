FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including snap7
RUN apt-get update && apt-get install -y \
    gcc \
    wget \
    unzip \
    p7zip-full \
    && rm -rf /var/lib/apt/lists/*

# Download and install snap7 library
RUN wget https://github.com/SCADACS/snap7/archive/refs/tags/v1.4.2.tar.gz \
    && tar -xzf v1.4.2.tar.gz \
    && cd snap7-1.4.2/build/unix \
    && make -f x86_64_linux.mk \
    && cp ../bin/x86_64-linux/libsnap7.so /usr/lib/ \
    && ldconfig \
    && cd /app \
    && rm -rf snap7-1.4.2 v1.4.2.tar.gz

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
