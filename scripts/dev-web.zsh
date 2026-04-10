#!/bin/zsh

set -euo pipefail
unsetopt BG_NICE

SCRIPT_DIR=${0:A:h}
REPO_ROOT=${SCRIPT_DIR:h}
API_DIR="$REPO_ROOT/apps/api"
API_VENV_PYTHON="$API_DIR/.venv/bin/python"
MOBILE_DIR="$REPO_ROOT/apps/mobile"
RUNTIME_DIR=${TMPDIR:-/tmp}/protocols-dev-web
API_PID_FILE="$RUNTIME_DIR/api.pid"
API_LOG_FILE="$RUNTIME_DIR/api.log"
WEB_PID_FILE="$RUNTIME_DIR/expo-web.pid"
WEB_LOG_FILE="$RUNTIME_DIR/expo-web.log"
WEB_PORT_FILE="$RUNTIME_DIR/expo-web.port"
API_URL="http://127.0.0.1:8000"
DEFAULT_WEB_PORT=${EXPO_WEB_PORT:-8081}

function usage() {
  cat <<'EOF'
Usage:
  ./scripts/dev-web.zsh start
  ./scripts/dev-web.zsh stop
  ./scripts/dev-web.zsh restart
  ./scripts/dev-web.zsh status

What it does:
  - starts the local API from apps/api/.venv
  - starts Expo web in the background
  - writes logs to /tmp/protocols-dev-web/
EOF
}

function require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

function ensure_runtime_dir() {
  mkdir -p "$RUNTIME_DIR"
}

function pid_from_file() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    cat "$pid_file"
  fi
}

function process_running() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

function api_pid() {
  pid_from_file "$API_PID_FILE"
}

function api_responding() {
  curl -fsS "$API_URL/openapi.json" >/dev/null 2>&1
}

function api_running() {
  process_running "$(api_pid || true)"
}

function web_pid() {
  pid_from_file "$WEB_PID_FILE"
}

function web_running() {
  process_running "$(web_pid || true)"
}

function web_port() {
  pid_from_file "$WEB_PORT_FILE"
}

function port_in_use() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

function choose_web_port() {
  local port="$DEFAULT_WEB_PORT"
  while port_in_use "$port"; do
    port=$((port + 1))
  done
  echo "$port"
}

function start_api() {
  ensure_runtime_dir

  if api_running; then
    echo "API is already running with PID $(api_pid)"
    return 0
  fi

  if api_responding; then
    echo "API is already responding at $API_URL"
    return 0
  fi

  if [[ ! -x "$API_VENV_PYTHON" ]]; then
    echo "Missing API virtualenv python: $API_VENV_PYTHON" >&2
    exit 1
  fi

  echo "Starting local API from $API_DIR ..."
  : > "$API_LOG_FILE"
  (
    cd "$API_DIR"
    nohup "$API_VENV_PYTHON" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >>"$API_LOG_FILE" 2>&1 &!
    echo $! > "$API_PID_FILE"
  )

  sleep 2
  if api_running; then
    echo "API started with PID $(api_pid)"
    echo "API log: $API_LOG_FILE"
  else
    echo "API failed to start. Check: $API_LOG_FILE" >&2
    return 1
  fi
}

function wait_for_api() {
  local attempts=30
  local sleep_seconds=1

  echo "Waiting for API at $API_URL ..."
  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$API_URL/openapi.json" >/dev/null 2>&1; then
      echo "API is responding at $API_URL"
      return 0
    fi
    sleep "$sleep_seconds"
  done

  echo "API did not become ready in ${attempts}s. Check: $API_LOG_FILE" >&2
  return 1
}

function start_web() {
  ensure_runtime_dir

  if web_running; then
    echo "Expo web is already running with PID $(web_pid)"
    return 0
  fi

  local web_port_to_use
  web_port_to_use="$(choose_web_port)"
  echo "$web_port_to_use" > "$WEB_PORT_FILE"

  if [[ "$web_port_to_use" != "$DEFAULT_WEB_PORT" ]]; then
    echo "Port $DEFAULT_WEB_PORT is in use; starting Expo web on $web_port_to_use instead."
  fi

  echo "Starting Expo web in the background..."
  : > "$WEB_LOG_FILE"
  (
    cd "$MOBILE_DIR"
    BROWSER=none EXPO_PUBLIC_API_URL="$API_URL" nohup npx expo start --web --clear --localhost --port "$web_port_to_use" >>"$WEB_LOG_FILE" 2>&1 &!
    echo $! > "$WEB_PID_FILE"
  )

  sleep 2
  if web_running; then
    echo "Expo web started with PID $(web_pid)"
    echo "Expo log: $WEB_LOG_FILE"
    echo "Web URL: http://localhost:$web_port_to_use"
  else
    echo "Expo web failed to start. Check: $WEB_LOG_FILE" >&2
    return 1
  fi
}

function stop_pid_file() {
  local pid_file="$1"
  local label="$2"

  if ! [[ -f "$pid_file" ]]; then
    echo "$label is not running"
    return 0
  fi

  local pid
  pid="$(pid_from_file "$pid_file")"
  if process_running "$pid"; then
    echo "Stopping $label (PID $pid)..."
    kill -TERM "$pid"

    for _ in $(seq 1 20); do
      if ! process_running "$pid"; then
        break
      fi
      sleep 0.5
    done
  fi

  rm -f "$pid_file"
}

function status() {
  if api_running; then
    local api_process_pid
    api_process_pid="$(api_pid)"
    echo "API:"
    ps -p "$api_process_pid" -o pid=,etime=,command=
    echo "Log: $API_LOG_FILE"
  elif api_responding; then
    echo "API: responding at $API_URL (managed outside this script)"
  else
    echo "API: not running"
    echo "Log: $API_LOG_FILE"
  fi

  echo

  if web_running; then
    local web_process_pid
    web_process_pid="$(web_pid)"
    echo "Expo web:"
    ps -p "$web_process_pid" -o pid=,etime=,command=
    echo "Log: $WEB_LOG_FILE"
    if [[ -f "$WEB_PORT_FILE" ]]; then
      echo "Web URL: http://localhost:$(web_port)"
    fi
  else
    echo "Expo web: not running"
    echo "Log: $WEB_LOG_FILE"
    if [[ -f "$WEB_PORT_FILE" ]]; then
      echo "Last web URL: http://localhost:$(web_port)"
    fi
  fi
}

function start() {
  require_cmd curl
  require_cmd lsof
  require_cmd npx
  require_cmd seq

  start_api
  wait_for_api
  start_web

  echo
  echo "API: $API_URL"
  echo "API log: $API_LOG_FILE"
  echo "Expo log: $WEB_LOG_FILE"
  if [[ -f "$WEB_PORT_FILE" ]]; then
    echo "Web URL: http://localhost:$(web_port)"
  fi
  echo "Use './scripts/dev-web.zsh status' to inspect the stack."
}

function stop() {
  stop_pid_file "$WEB_PID_FILE" "Expo web"
  stop_pid_file "$API_PID_FILE" "API"
  rm -f "$WEB_PORT_FILE"
}

case "${1:-start}" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    start
    ;;
  status)
    status
    ;;
  *)
    usage
    exit 1
    ;;
esac
