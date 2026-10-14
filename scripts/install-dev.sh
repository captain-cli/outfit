#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(
    cd "$(dirname "${BASH_SOURCE[0]}")/.." &&
    pwd
)"

INSTALL_ROOT="/usr/lib/captain/outfit"
CONFIG_ROOT="/etc/captain/outfit"
STATE_ROOT="/var/lib/captain/outfit"
RECEIPT_ROOT="${STATE_ROOT}/receipts"
SUDOERS_SOURCE="${ROOT_DIR}/packaging/sudoers/captain-outfit"
SUDOERS_TARGET="/etc/sudoers.d/captain-outfit"

echo "Building Outfit..."
cd "${ROOT_DIR}"
npm run build

echo "Creating system directories..."

sudo install \
    -d \
    -m 0755 \
    "${INSTALL_ROOT}"

sudo install \
    -d \
    -m 0755 \
    "${CONFIG_ROOT}"

sudo install \
    -d \
    -m 0750 \
    "${STATE_ROOT}"

sudo install \
    -d \
    -m 0750 \
    "${RECEIPT_ROOT}"

echo "Installing trusted registry keys..."

sudo install -d -m 0755 "${CONFIG_ROOT}/trust"

for public_key in "${ROOT_DIR}"/packaging/trust/*.pem; do
    [ -f "${public_key}" ] || continue

    sudo install -o root -g root -m 0644 \
        "${public_key}" \
        "${CONFIG_ROOT}/trust/$(basename "${public_key}")"
done

echo "Installing compiled Outfit runtime..."

sudo rm -rf \
    "${INSTALL_ROOT}/dist"

sudo cp -R \
    "${ROOT_DIR}/dist" \
    "${INSTALL_ROOT}/dist"

sudo chown -R \
    root:root \
    "${INSTALL_ROOT}"

sudo chmod -R \
    go-w \
    "${INSTALL_ROOT}"

sudo install \
    -m 0644 \
    "${ROOT_DIR}/package.json" \
    "${INSTALL_ROOT}/package.json"

sudo chmod +x \
    "${INSTALL_ROOT}/dist/cli.js"

sudo chmod +x \
    "${INSTALL_ROOT}/dist/helper/cli.js"

echo "Installing Outfit command..."

sudo ln -sfn \
    "${INSTALL_ROOT}/dist/cli.js" \
    /usr/bin/outfit

echo "Installing privileged helper entry point..."

sudo install \
    -o root \
    -g root \
    -m 0755 \
    "${ROOT_DIR}/packaging/bin/outfit-helper" \
    "${INSTALL_ROOT}/outfit-helper"

echo
echo "Outfit development installation complete."
echo
echo "CLI:"
echo "  /usr/bin/outfit"
echo
echo "Helper:"
echo "  ${INSTALL_ROOT}/outfit-helper"

echo "Validating Outfit privilege policy..."

sudo visudo \
    -cf \
    "${SUDOERS_SOURCE}"

echo "Installing Outfit privilege policy..."

sudo install \
    -o root \
    -g root \
    -m 0440 \
    "${SUDOERS_SOURCE}" \
    "${SUDOERS_TARGET}"

echo "Validating privilege policy..."

sudo visudo \
    -cf \
    "${SUDOERS_TARGET}"