#!/bin/bash
set -e

REGISTRY="registry.yurii.live"
PLATFORMS="linux/amd64,linux/arm64"
IMAGE="${REGISTRY}/erep-calculator"

# Extract version from package.json
VERSION=$(node -p "require('./package.json').version")

if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from package.json"
    exit 1
fi

# Ensure buildx builder exists and supports multi-platform
BUILDER_NAME="multiplatform"
if ! docker buildx inspect "$BUILDER_NAME" &>/dev/null; then
    echo "Creating buildx builder '${BUILDER_NAME}'..."
    docker buildx create --name "$BUILDER_NAME" --use
fi
docker buildx use "$BUILDER_NAME"

# Build the Vite/React bundle on the host. Done here (not in the image) because
# esbuild is fragile inside buildkit/QEMU; the resulting dist/ is static and
# platform-independent, so the image just copies it in.
echo "Building production bundle..."
npm ci
npm run build

# Build and push
echo "Building and pushing ${IMAGE}:${VERSION} for ${PLATFORMS}..."
docker buildx build \
    --platform "$PLATFORMS" \
    --tag "${IMAGE}:${VERSION}" \
    --tag "${IMAGE}:latest" \
    --push \
    .

echo ""
echo "Release complete!"
echo "  - ${IMAGE}:${VERSION}"
echo "  - Platforms: ${PLATFORMS}"
