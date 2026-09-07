# Provides the isolated local security-runtime dependencies; the copied signer source remains the exact candidate under test.
FROM golang:1.23-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends softhsm2 opensc openssl ca-certificates socat \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go test ./...

ENV HOME=/tmp \
    GOCACHE=/tmp/go-cache

ENTRYPOINT ["./local/softhsm2/run-host.sh"]
