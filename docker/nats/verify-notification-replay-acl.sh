#!/usr/bin/env sh
# Proves that a run-bound Notification credential can replay only its three approved Collaboration Task subjects.
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
config="$repo_root/docker/nats/nats-server.conf"
topology_dir="$repo_root/docker/nats/topology"
network="oes_ev3_acl_${$}"
server="oes_ev3_acl_server_${$}"

replay_user=notification-replay-acl-test
replay_password=local-validation-only
recovery_user=notification-recovery-acl-test
recovery_password=local-validation-only
replay_assigned_consumer=notification-service__replay__acltest__assigned
replay_completed_consumer=notification-service__replay__acltest__completed
replay_cancelled_consumer=notification-service__replay__acltest__cancelled
assigned_create_subject="\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.$replay_assigned_consumer.oes.events.collaboration.task.assigned"
completed_create_subject="\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.$replay_completed_consumer.oes.events.collaboration.task.completed"
cancelled_create_subject="\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.$replay_cancelled_consumer.oes.events.collaboration.task.cancelled"
assigned_info_subject="\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.$replay_assigned_consumer"
completed_info_subject="\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.$replay_completed_consumer"
cancelled_info_subject="\$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.$replay_cancelled_consumer"
assigned_delete_subject="\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.$replay_assigned_consumer"
completed_delete_subject="\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.$replay_completed_consumer"
cancelled_delete_subject="\$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.$replay_cancelled_consumer"
assigned_next_subject="\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.$replay_assigned_consumer"
completed_next_subject="\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.$replay_completed_consumer"
cancelled_next_subject="\$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.$replay_cancelled_consumer"
assigned_ack_subject="\$JS.ACK.OES_BUSINESS_EVENTS.$replay_assigned_consumer.>"
completed_ack_subject="\$JS.ACK.OES_BUSINESS_EVENTS.$replay_completed_consumer.>"
cancelled_ack_subject="\$JS.ACK.OES_BUSINESS_EVENTS.$replay_cancelled_consumer.>"

cleanup() {
  docker rm -f "$server" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

for required in \
  "$config" \
  "$topology_dir/oes-business-events.json" \
  "$topology_dir/oes-event-dlq.json" \
  "$topology_dir/notification-service__collaboration-task__v1.json" \
  "$topology_dir/notification-service__dlq-inspection__v1.json"; do
  test -f "$required" || {
    echo "missing required replay ACL artifact: $required" >&2
    exit 1
  }
done

grep -Fq 'NATS_NOTIFICATION_REPLAY_USER' "$config"
grep -Fq 'NATS_NOTIFICATION_REPLAY_ASSIGNED_CREATE_SUBJECT' "$config"
grep -Fq 'NATS_NOTIFICATION_REPLAY_COMPLETED_CREATE_SUBJECT' "$config"
grep -Fq 'NATS_NOTIFICATION_REPLAY_CANCELLED_CREATE_SUBJECT' "$config"
grep -Fq 'NATS_NOTIFICATION_RECOVERY_USER' "$config"
grep -Fq 'MAX_DELIVERIES.OES_BUSINESS_EVENTS.notification-service__collaboration-task__v1' "$config"
grep -Fq 'notification-service__dlq-inspection__v1' "$config"
! grep -Eq '\$JS\.API\.CONSUMER\.(CREATE|DELETE|INFO|MSG\.NEXT)\.OES_BUSINESS_EVENTS\.>' "$config"
! grep -Fq '$JS.API.STREAM.>' "$config"

docker network create "$network" >/dev/null
docker run -d --name "$server" --network "$network" --network-alias nats \
  -e NATS_COLLABORATION_USER=collaboration-publisher \
  -e NATS_COLLABORATION_PASSWORD=local-validation-only \
  -e NATS_NOTIFICATION_USER=notification-consumer \
  -e NATS_NOTIFICATION_PASSWORD=local-validation-only \
  -e NATS_NOTIFICATION_REPLAY_USER="$replay_user" \
  -e NATS_NOTIFICATION_REPLAY_PASSWORD="$replay_password" \
  -e NATS_NOTIFICATION_RECOVERY_USER="$recovery_user" \
  -e NATS_NOTIFICATION_RECOVERY_PASSWORD="$recovery_password" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_CREATE_SUBJECT="'$assigned_create_subject'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_CREATE_SUBJECT="'$completed_create_subject'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_CREATE_SUBJECT="'$cancelled_create_subject'" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_INFO_SUBJECT="'$assigned_info_subject'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_INFO_SUBJECT="'$completed_info_subject'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_INFO_SUBJECT="'$cancelled_info_subject'" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_DELETE_SUBJECT="'$assigned_delete_subject'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_DELETE_SUBJECT="'$completed_delete_subject'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_DELETE_SUBJECT="'$cancelled_delete_subject'" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_NEXT_SUBJECT="'$assigned_next_subject'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_NEXT_SUBJECT="'$completed_next_subject'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_NEXT_SUBJECT="'$cancelled_next_subject'" \
  -e NATS_NOTIFICATION_REPLAY_ASSIGNED_ACK_SUBJECT="'$assigned_ack_subject'" \
  -e NATS_NOTIFICATION_REPLAY_COMPLETED_ACK_SUBJECT="'$completed_ack_subject'" \
  -e NATS_NOTIFICATION_REPLAY_CANCELLED_ACK_SUBJECT="'$cancelled_ack_subject'" \
  -e NATS_OPERATOR_USER=platform-operator \
  -e NATS_OPERATOR_PASSWORD=local-validation-only \
  -v "$config:/etc/nats/nats-server.conf:ro" \
  nats:2.10.26-alpine -c /etc/nats/nats-server.conf >/dev/null

for _ in $(seq 1 20); do
  if docker run --rm --network "$network" natsio/nats-box:0.14.5 \
    nats --server nats://nats:4222 --user platform-operator --password local-validation-only --timeout 1s request \
      '$JS.API.INFO' '' >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker ps --format '{{.Names}}' | grep -Fxq "$server" || {
  docker logs "$server" >&2 || true
  echo 'isolated NATS ACL test server did not become ready' >&2
  exit 1
}

nats_as() {
  user=$1
  password=$2
  shift 2
  docker run --rm --network "$network" -v "$topology_dir:/topology:ro" natsio/nats-box:0.14.5 \
    nats --server nats://nats:4222 --user "$user" --password "$password" --timeout 2s "$@"
}

must_fail() {
  label=$1
  shift
  if "$@" >/tmp/oes-ev3-acl-denied.log 2>&1 && \
    ! grep -Fq 'Permissions Violation' /tmp/oes-ev3-acl-denied.log; then
    echo "expected authorization denial: $label" >&2
    cat /tmp/oes-ev3-acl-denied.log >&2
    exit 1
  fi
}

for stream in oes-business-events oes-event-dlq oes-event-advisories; do
  nats_as platform-operator local-validation-only stream add --config "/topology/$stream.json" --defaults >/dev/null
done
nats_as platform-operator local-validation-only consumer add OES_BUSINESS_EVENTS \
  --config /topology/notification-service__collaboration-task__v1.json --defaults >/dev/null
nats_as platform-operator local-validation-only consumer add OES_EVENT_DLQ \
  --config /topology/notification-service__dlq-inspection__v1.json --defaults >/dev/null

# The shared client performs this read-only JetStream capability query before creating a replay consumer.
nats_as "$replay_user" "$replay_password" request --raw '$JS.API.INFO' '' \
  | grep -Fq 'io.nats.jetstream.api.v1.account_info_response'

create_replay_consumer() {
  consumer=$1
  filter=$2
  nats_as "$replay_user" "$replay_password" request --raw \
    "\$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.$consumer.$filter" \
    "{\"stream_name\":\"OES_BUSINESS_EVENTS\",\"config\":{\"durable_name\":\"$consumer\",\"ack_policy\":\"explicit\",\"deliver_policy\":\"by_start_sequence\",\"opt_start_seq\":1,\"filter_subject\":\"$filter\",\"replay_policy\":\"instant\",\"inactive_threshold\":3600000000000}}" \
    | grep -Fq 'consumer_create_response'
}

create_replay_consumer "$replay_assigned_consumer" oes.events.collaboration.task.assigned
create_replay_consumer "$replay_completed_consumer" oes.events.collaboration.task.completed
create_replay_consumer "$replay_cancelled_consumer" oes.events.collaboration.task.cancelled

nats_as "$replay_user" "$replay_password" consumer info OES_BUSINESS_EVENTS "$replay_assigned_consumer" >/dev/null
nats_as "$replay_user" "$replay_password" consumer info OES_BUSINESS_EVENTS "$replay_completed_consumer" >/dev/null
nats_as "$replay_user" "$replay_password" consumer info OES_BUSINESS_EVENTS "$replay_cancelled_consumer" >/dev/null
nats_as collaboration-publisher local-validation-only pub \
  oes.events.collaboration.task.assigned '{"kind":"acl-proof"}' >/dev/null
nats_as "$replay_user" "$replay_password" request --raw --replies 1 \
  "$assigned_next_subject" '{"batch":1,"expires":1000000000}' | grep -Fq 'acl-proof'
nats_as notification-consumer local-validation-only consumer info OES_BUSINESS_EVENTS \
  notification-service__collaboration-task__v1 >/dev/null
nats_as notification-consumer local-validation-only pub \
  oes.dlq.notification-service.collaboration-task.v1 '{"kind":"acl-proof"}' >/dev/null
nats_as notification-consumer local-validation-only consumer info OES_EVENT_DLQ \
  notification-service__dlq-inspection__v1 >/dev/null

must_fail 'Asset filter creation' create_replay_consumer asset-replay-acl-test oes.events.asset.site-media.available
must_fail 'unscoped replay consumer name' create_replay_consumer rogue-replay-acl-test oes.events.collaboration.task.assigned
must_fail 'wildcard business subscription' nats_as "$replay_user" "$replay_password" sub 'oes.events.>'
must_fail 'multi-filter/general consumer API' nats_as "$replay_user" "$replay_password" request \
  '$JS.API.CONSUMER.DURABLE.CREATE.OES_BUSINESS_EVENTS.rogue-replay-acl-test' \
  '{"stream_name":"OES_BUSINESS_EVENTS","config":{"durable_name":"rogue-replay-acl-test","filter_subjects":["oes.events.collaboration.task.assigned","oes.events.collaboration.task.completed"]}}'
must_fail 'broad stream management' nats_as "$replay_user" "$replay_password" stream info OES_BUSINESS_EVENTS
must_fail 'cross-service DLQ publication' nats_as notification-consumer local-validation-only pub \
  oes.dlq.asset-service.site-media.v1 '{"kind":"acl-proof"}'
must_fail 'Notification broad consumer management' nats_as notification-consumer local-validation-only consumer ls OES_BUSINESS_EVENTS
must_fail 'recovery source ACK or TERM' nats_as "$recovery_user" "$recovery_password" request \
  '$JS.ACK.OES_BUSINESS_EVENTS.notification-service__collaboration-task__v1.1.1.1.1.0' ''
must_fail 'recovery raw business stream read' nats_as "$recovery_user" "$recovery_password" request \
  '$JS.API.STREAM.MSG.GET.OES_BUSINESS_EVENTS' '{"seq":1}'
must_fail 'recovery wildcard advisory subscription' nats_as "$recovery_user" "$recovery_password" sub '$JS.EVENT.ADVISORY.>'
must_fail 'recovery cross-service DLQ publication' nats_as "$recovery_user" "$recovery_password" pub \
  oes.dlq.asset-service.site-media.v1 '{"kind":"acl-proof"}'
nats_as "$recovery_user" "$recovery_password" pub \
  oes.dlq.notification-service.collaboration-task.v1 '{"kind":"recovery-acl-proof"}' >/dev/null
nats_as "$replay_user" "$replay_password" consumer rm OES_BUSINESS_EVENTS "$replay_cancelled_consumer" --force >/dev/null

echo 'EV3_NOTIFICATION_REPLAY_ACL_READY'
