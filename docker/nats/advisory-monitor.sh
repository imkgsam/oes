#!/usr/bin/env sh
# Emits locally visible alerts for persisted JetStream terminal and MaxDeliver advisories.
set -eu

nats_cmd() {
  nats --server "${NATS_URL:-nats://nats:4222}" \
    --user "$NATS_OPERATOR_USER" \
    --password "$NATS_OPERATOR_PASSWORD" "$@"
}

nats_cmd sub '$JS.EVENT.ADVISORY.CONSUMER.MAX_DELIVERIES.>' --raw &
max_deliver_pid=$!
nats_cmd sub '$JS.EVENT.ADVISORY.CONSUMER.MSG_TERMINATED.>' --raw &
terminated_pid=$!

trap 'kill "$max_deliver_pid" "$terminated_pid" 2>/dev/null || true; wait' INT TERM
wait "$max_deliver_pid" "$terminated_pid"
