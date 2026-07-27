#!/usr/bin/env sh
# Bootstraps the frozen local streams and durable consumer without mutating existing topology state.
set -eu

nats_cmd() {
  nats --server "${NATS_URL:-nats://nats:4222}" \
    --user "$NATS_OPERATOR_USER" \
    --password "$NATS_OPERATOR_PASSWORD" "$@"
}

ensure_stream() {
  stream_name=$1
  config_path=$2
  if nats_cmd stream info "$stream_name" >/dev/null 2>&1; then
    echo "stream already exists: $stream_name"
    return
  fi
  nats_cmd stream add --config "$config_path" --defaults
  echo "stream created: $stream_name"
}

ensure_stream OES_BUSINESS_EVENTS /etc/nats/topology/oes-business-events.json
ensure_stream OES_EVENT_DLQ /etc/nats/topology/oes-event-dlq.json
ensure_stream OES_EVENT_ADVISORIES /etc/nats/topology/oes-event-advisories.json

consumer_name=notification-service__collaboration-task__v1
if nats_cmd consumer info OES_BUSINESS_EVENTS "$consumer_name" >/dev/null 2>&1; then
  echo "consumer already exists: $consumer_name"
else
  nats_cmd consumer add OES_BUSINESS_EVENTS --config \
    /etc/nats/topology/notification-service__collaboration-task__v1.json --defaults
  echo "consumer created: $consumer_name"
fi

dlq_inspection_consumer=notification-service__dlq-inspection__v1
if nats_cmd consumer info OES_EVENT_DLQ "$dlq_inspection_consumer" >/dev/null 2>&1; then
  echo "consumer already exists: $dlq_inspection_consumer"
else
  nats_cmd consumer add OES_EVENT_DLQ --config \
    /etc/nats/topology/notification-service__dlq-inspection__v1.json --defaults
  echo "consumer created: $dlq_inspection_consumer"
fi
