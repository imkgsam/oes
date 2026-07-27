#!/usr/bin/env sh
# Validates the local NATS topology, ACL shape, and bootstrap manifests without starting unrelated infrastructure.
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
config="$repo_root/docker/nats/nats-server.conf"
topology_dir="$repo_root/docker/nats/topology"

for required in \
  "$config" \
  "$topology_dir/oes-business-events.json" \
  "$topology_dir/oes-event-dlq.json" \
  "$topology_dir/oes-event-advisories.json" \
  "$topology_dir/notification-service__collaboration-task__v1.json" \
  "$topology_dir/notification-service__dlq-inspection__v1.json" \
  "$repo_root/docker/nats/bootstrap.sh" \
  "$repo_root/docs/runbooks/event-bus-nats.md"; do
  test -f "$required" || {
    echo "missing required NATS topology artifact: $required" >&2
    exit 1
  }
done

grep -Fq 'oes.events.collaboration.task.assigned' "$config"
grep -Fq 'oes.events.collaboration.task.completed' "$config"
grep -Fq 'oes.events.collaboration.task.cancelled' "$config"
grep -Fq 'oes.dlq.notification-service.collaboration-task.v1' "$config"
grep -Fq 'NATS_NOTIFICATION_REPLAY_USER' "$config"
grep -Fq '"$JS.API.INFO"' "$config"
grep -Fq 'NATS_NOTIFICATION_REPLAY_ASSIGNED_CREATE_SUBJECT' "$config"
grep -Fq 'NATS_NOTIFICATION_REPLAY_COMPLETED_CREATE_SUBJECT' "$config"
grep -Fq 'NATS_NOTIFICATION_REPLAY_CANCELLED_CREATE_SUBJECT' "$config"
grep -Fq 'NATS_NOTIFICATION_RECOVERY_USER' "$config"
grep -Fq 'MAX_DELIVERIES.OES_BUSINESS_EVENTS.notification-service__collaboration-task__v1' "$config"
grep -Fq 'notification-service__dlq-inspection__v1' "$config"
grep -Fq '$JS.ACK.OES_BUSINESS_EVENTS.notification-service__collaboration-task__v1.>' "$config"
! grep -Fq 'no_auth_user' "$config"
! grep -Eq 'OES_EVENT_REPLAY|oes\.replay' "$config" "$topology_dir"/*.json "$repo_root/docker/nats/bootstrap.sh"

node - "$topology_dir" <<'NODE'
const fs = require('fs');
const path = require('path');
const topology = process.argv[2];
const read = (name) => JSON.parse(fs.readFileSync(path.join(topology, name), 'utf8'));
const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const business = read('oes-business-events.json');
expect(business.name === 'OES_BUSINESS_EVENTS', 'business stream name');
expect(JSON.stringify(business.subjects) === JSON.stringify(['oes.events.>']), 'business stream subject');
expect(business.storage === 'file' && business.num_replicas === 1, 'business storage/replicas');
expect(business.retention === 'limits' && business.discard === 'new', 'business retention/discard');
expect(business.max_age === 604800000000000, 'business local retention must be seven days');
expect(Number.isFinite(business.max_bytes) && business.max_bytes > 0, 'business max bytes');

const dlq = read('oes-event-dlq.json');
expect(dlq.name === 'OES_EVENT_DLQ', 'DLQ stream name');
expect(JSON.stringify(dlq.subjects) === JSON.stringify(['oes.dlq.>']), 'DLQ subject');
expect(dlq.storage === 'file' && dlq.num_replicas === 1, 'DLQ storage/replicas');
expect(dlq.retention === 'limits' && dlq.discard === 'new', 'DLQ retention/discard');
expect(Number.isFinite(dlq.max_bytes) && dlq.max_bytes > 0 && dlq.max_age > business.max_age, 'bounded DLQ retention');

const advisory = read('oes-event-advisories.json');
expect(advisory.name === 'OES_EVENT_ADVISORIES', 'advisory stream name');
expect(JSON.stringify(advisory.subjects) === JSON.stringify(['$JS.EVENT.ADVISORY.>']), 'advisory source');
expect(advisory.storage === 'file', 'advisory persistence');

const consumer = read('notification-service__collaboration-task__v1.json');
expect(consumer.durable_name === 'notification-service__collaboration-task__v1', 'durable name');
expect(consumer.ack_policy === 'explicit' && consumer.deliver_policy === 'new', 'consumer delivery policy');
expect(consumer.max_deliver === 5, 'consumer max delivery');
expect(JSON.stringify(consumer.filter_subjects) === JSON.stringify([
  'oes.events.collaboration.task.assigned',
  'oes.events.collaboration.task.completed',
  'oes.events.collaboration.task.cancelled',
]), 'consumer filters');

const dlqInspection = read('notification-service__dlq-inspection__v1.json');
expect(dlqInspection.durable_name === 'notification-service__dlq-inspection__v1', 'DLQ inspection durable name');
expect(dlqInspection.ack_policy === 'explicit' && dlqInspection.deliver_policy === 'all', 'DLQ inspection delivery policy');
expect(dlqInspection.max_deliver === 1, 'DLQ inspection must not retry inspection delivery');
expect(dlqInspection.filter_subject === 'oes.dlq.notification-service.collaboration-task.v1', 'DLQ inspection filter');
NODE

docker run --rm \
  -e NATS_COLLABORATION_USER=collaboration-publisher \
  -e NATS_COLLABORATION_PASSWORD=local-validation-only \
  -e NATS_NOTIFICATION_USER=notification-consumer \
  -e NATS_NOTIFICATION_PASSWORD=local-validation-only \
  -e NATS_NOTIFICATION_REPLAY_USER=notification-replay \
  -e NATS_NOTIFICATION_REPLAY_PASSWORD=local-validation-only \
  -e NATS_NOTIFICATION_RECOVERY_USER=notification-recovery \
  -e NATS_NOTIFICATION_RECOVERY_PASSWORD=local-validation-only \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_CREATE_SUBJECT="'\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned.oes.events.collaboration.task.assigned'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_CREATE_SUBJECT="'\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed.oes.events.collaboration.task.completed'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_CREATE_SUBJECT="'\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled.oes.events.collaboration.task.cancelled'" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_INFO_SUBJECT="'\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_INFO_SUBJECT="'\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_INFO_SUBJECT="'\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled'" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_DELETE_SUBJECT="'\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_DELETE_SUBJECT="'\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_DELETE_SUBJECT="'\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled'" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_NEXT_SUBJECT="'\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_NEXT_SUBJECT="'\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_NEXT_SUBJECT="'\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled'" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_ACK_SUBJECT="'\$JS.ACK.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned.>'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_ACK_SUBJECT="'\$JS.ACK.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed.>'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_ACK_SUBJECT="'\$JS.ACK.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled.>'" \
  -e NATS_OPERATOR_USER=platform-operator \
  -e NATS_OPERATOR_PASSWORD=local-validation-only \
  -v "$config:/etc/nats/nats-server.conf:ro" \
  nats:2.10.26-alpine \
  nats-server -t --config /etc/nats/nats-server.conf

NATS_COLLABORATION_USER=collaboration-publisher \
NATS_COLLABORATION_PASSWORD=local-validation-only \
NATS_NOTIFICATION_USER=notification-consumer \
NATS_NOTIFICATION_PASSWORD=local-validation-only \
NATS_NOTIFICATION_REPLAY_USER=notification-replay \
NATS_NOTIFICATION_REPLAY_PASSWORD=local-validation-only \
NATS_NOTIFICATION_RECOVERY_USER=notification-recovery \
NATS_NOTIFICATION_RECOVERY_PASSWORD=local-validation-only \
NATS_NOTIFICATION_REPLAY_ASSIGNED_CREATE_SUBJECT="'\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned.oes.events.collaboration.task.assigned'" \
NATS_NOTIFICATION_REPLAY_COMPLETED_CREATE_SUBJECT="'\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed.oes.events.collaboration.task.completed'" \
NATS_NOTIFICATION_REPLAY_CANCELLED_CREATE_SUBJECT="'\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled.oes.events.collaboration.task.cancelled'" \
NATS_NOTIFICATION_REPLAY_ASSIGNED_INFO_SUBJECT="'\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned'" \
NATS_NOTIFICATION_REPLAY_COMPLETED_INFO_SUBJECT="'\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed'" \
NATS_NOTIFICATION_REPLAY_CANCELLED_INFO_SUBJECT="'\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled'" \
NATS_NOTIFICATION_REPLAY_ASSIGNED_DELETE_SUBJECT="'\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned'" \
NATS_NOTIFICATION_REPLAY_COMPLETED_DELETE_SUBJECT="'\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed'" \
NATS_NOTIFICATION_REPLAY_CANCELLED_DELETE_SUBJECT="'\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled'" \
NATS_NOTIFICATION_REPLAY_ASSIGNED_NEXT_SUBJECT="'\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned'" \
NATS_NOTIFICATION_REPLAY_COMPLETED_NEXT_SUBJECT="'\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed'" \
NATS_NOTIFICATION_REPLAY_CANCELLED_NEXT_SUBJECT="'\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled'" \
NATS_NOTIFICATION_REPLAY_ASSIGNED_ACK_SUBJECT="'\$JS.ACK.OES_BUSINESS_EVENTS.notification-service__replay__validation__assigned.>'" \
NATS_NOTIFICATION_REPLAY_COMPLETED_ACK_SUBJECT="'\$JS.ACK.OES_BUSINESS_EVENTS.notification-service__replay__validation__completed.>'" \
NATS_NOTIFICATION_REPLAY_CANCELLED_ACK_SUBJECT="'\$JS.ACK.OES_BUSINESS_EVENTS.notification-service__replay__validation__cancelled.>'" \
NATS_OPERATOR_USER=platform-operator \
NATS_OPERATOR_PASSWORD=local-validation-only \
  docker compose -f "$repo_root/docker-compose.infra.yml" config -q

echo 'EV3_NATS_TOPOLOGY_READY'
