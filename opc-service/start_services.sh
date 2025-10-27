#!/bin/bash
# Startup script for OPC-Service container
# Runs both OPC UA and S7 protocol services

echo "═══════════════════════════════════════════════════════════════"
echo "  CMMS PLC Integration Services"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Starting services..."
echo ""

# Function to handle shutdown
shutdown() {
    echo ""
    echo "Shutting down services..."
    kill $OPC_PID $S7_PID 2>/dev/null
    wait $OPC_PID $S7_PID 2>/dev/null
    echo "Services stopped"
    exit 0
}

# Trap SIGTERM and SIGINT
trap shutdown SIGTERM SIGINT

# Wait for database to be available
echo "Waiting for database..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if [ -f "/data/database.sqlite" ]; then
        echo "✅ Database found!"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting for database... ($attempt/$max_attempts)"
    sleep 2
done

if [ ! -f "/data/database.sqlite" ]; then
    echo "⚠️  Database not found yet. Services will start anyway and wait for database."
fi

echo ""

# Start OPC UA service in background
echo "Starting OPC UA Service..."
python -u opc_service_v2.py &
OPC_PID=$!
echo "  OPC UA Service PID: $OPC_PID"

# Start S7 service in background
echo "Starting S7 Protocol Service..."
python -u s7_service.py &
S7_PID=$!
echo "  S7 Service PID: $S7_PID"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ All services started successfully!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Services running:"
echo "  • OPC UA Service (PID: $OPC_PID) - For OPC UA PLCs"
echo "  • S7 Service (PID: $S7_PID) - For Siemens S7 PLCs"
echo ""
echo "Database: /data/database.sqlite"
echo ""
echo "Configure connections via CMMS web interface:"
echo "  • OPC UA: Settings -> OPC Configuration"
echo "  • S7 PLCs: Settings -> S7 PLC Configuration"
echo ""
echo "Press Ctrl+C to stop all services"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Wait for both processes
wait $OPC_PID $S7_PID

# If either process exits, exit the script
echo "One or more services have stopped. Exiting..."
exit 1
