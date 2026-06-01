# Minimal runtime image. The Vite/React bundle (dist/) is built on the host by
# release.sh and copied in — server.js uses only Node built-ins, so the image
# carries no node_modules and does no in-image compilation. This mirrors the
# battle-stats pattern (copy a pre-built artifact) and keeps the build immune to
# esbuild/QEMU crashes inside buildkit.
FROM node:20-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Pre-built assets (run `npm run build` first — release.sh does this) + server
COPY dist ./dist
COPY server.js ./
COPY server ./server
# server.js reads this at runtime for the Society-page universe builder.
COPY src/data/countries.json ./src/data/countries.json

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

# PORT is overridable; defaults to 8080 (see server.js)
CMD ["node", "server.js"]
