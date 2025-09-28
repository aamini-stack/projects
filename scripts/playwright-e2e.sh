#!/bin/bash
set -e

# This script runs the e2e update command in the playwright docker container.

# The `--workdir /work/` sets the working directory inside the container.
# The `--volume "$(pwd)":/work/` mounts the current directory into the container's /work/ directory.
# The `--rm` flag removes the container after it exits.
# The `-it` flags allocate a pseudo-TTY.
# The `mcr.microsoft.com/playwright:v1.40.0-jammy` is the playwright docker image.
# container run --workdir /work/ --volume "$(pwd)":/work/ 

# Find all screenshot directories
SCREENSHOT_DIRS=$(find . -type d -not -path "./test-results/*" \( -name "*-snapshots" -o -regex ".*-Screenshot-.*" \))

VOLUME_MOUNTS=""
for dir in $SCREENSHOT_DIRS; do
  # Remove the leading './' from the directory path for consistent mounting
  RELATIVE_DIR=${dir#./}
  VOLUME_MOUNTS+=" -v $(pwd)/$RELATIVE_DIR:/app/$RELATIVE_DIR"
done

echo $VOLUME_MOUNTS
# Replace 'your_docker_image' with your actual Playwright Docker image
# Replace 'npm test' with the command to run your Playwright tests inside the container
docker run \
  $VOLUME_MOUNTS \
  -w /app \
	--rm -it mcr.microsoft.com/playwright:v1.55.1-jammy /bin/bash -c \
  "corepack enable pnpm && pnpm i && pnpm turbo e2e:update"
