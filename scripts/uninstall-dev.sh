#!/usr/bin/env bash

set -euo pipefail

INSTALL_ROOT="/usr/lib/captain/outfit"

sudo rm -f \
    /usr/bin/outfit

sudo rm -rf \
    "${INSTALL_ROOT}"

sudo rm -f \
    /etc/sudoers.d/captain-outfit

echo "Outfit runtime removed."
echo
echo "Configuration and receipts were preserved:"
echo "  /etc/captain/outfit"
echo "  /var/lib/captain/outfit"