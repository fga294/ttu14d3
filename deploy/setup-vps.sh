#!/bin/bash
# One-time VPS setup script for TTU14D3
# Run as: ssh -i oracle-cloud.key opc@152.67.98.57 'bash -s' < deploy/setup-vps.sh
set -e

echo "=== Installing Python 3.12 ==="
sudo dnf install -y python3.12 python3.12-pip 2>/dev/null || {
  echo "dnf python3.12 not available, trying alternatives..."
  sudo yum install -y oracle-release-el7 2>/dev/null
  sudo yum install -y python3.11 python3.11-pip 2>/dev/null || {
    echo "Installing Python from source..."
    sudo yum install -y gcc openssl-devel bzip2-devel libffi-devel zlib-devel make
    cd /tmp
    curl -O https://www.python.org/ftp/python/3.12.4/Python-3.12.4.tgz
    tar xzf Python-3.12.4.tgz
    cd Python-3.12.4
    ./configure --enable-optimizations --prefix=/usr/local
    sudo make altinstall
    cd ~
  }
}

# Find the python3 binary (3.11 or 3.12)
PYTHON=$(command -v python3.12 || command -v python3.11 || echo "/usr/local/bin/python3.12")
echo "Using Python: $PYTHON"
$PYTHON --version

echo "=== Cloning repository ==="
sudo mkdir -p /opt/ttu14d3
sudo chown opc:opc /opt/ttu14d3
if [ -d /opt/ttu14d3/.git ]; then
  cd /opt/ttu14d3 && git pull
else
  git clone https://github.com/fga294/ttu14d3.git /opt/ttu14d3
fi

echo "=== Setting up Python venv ==="
$PYTHON -m venv /opt/ttu14d3/venv
source /opt/ttu14d3/venv/bin/activate
pip install --upgrade pip
pip install -r /opt/ttu14d3/backend/requirements.txt

echo "=== Creating backend .env ==="
if [ ! -f /opt/ttu14d3/backend/.env ]; then
  cat > /opt/ttu14d3/backend/.env << 'ENVEOF'
DB_HOST=127.0.0.1
DB_USER=fogoroos_user
DB_PASS=zaq12wsx
DB_NAME=ttu14_db
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
FRONTEND_URL=https://ttu14.team
ENVEOF
  echo "Created .env — edit credentials if needed: nano /opt/ttu14d3/backend/.env"
else
  echo ".env already exists, skipping"
fi

echo "=== Installing systemd service ==="
sudo cp /opt/ttu14d3/deploy/ttu14-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ttu14-api
sudo systemctl start ttu14-api
sudo systemctl status ttu14-api --no-pager

echo "=== Configuring Nginx ==="
sudo cp /opt/ttu14d3/deploy/nginx-api.conf /etc/nginx/conf.d/ttu14-api.conf
sudo nginx -t && sudo systemctl reload nginx

echo "=== Opening firewall ports ==="
sudo firewall-cmd --permanent --add-service=http 2>/dev/null || true
sudo firewall-cmd --permanent --add-service=https 2>/dev/null || true
sudo firewall-cmd --reload 2>/dev/null || true

echo ""
echo "=== Setup complete! ==="
echo "API should be running at http://152.67.98.57:80/api/health"
echo "Test: curl http://localhost:3001/api/health"
