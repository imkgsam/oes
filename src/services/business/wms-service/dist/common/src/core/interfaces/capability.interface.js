"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transport = void 0;
var Transport;
(function (Transport) {
    Transport["GRPC"] = "grpc";
    Transport["HTTP"] = "http";
    Transport["KAFKA"] = "kafka";
    Transport["MQTT"] = "mqtt";
    Transport["NATS"] = "nats";
    Transport["REDIS"] = "redis";
    Transport["RMQ"] = "rmq";
    Transport["TCP"] = "tcp";
})(Transport || (exports.Transport = Transport = {}));
//# sourceMappingURL=capability.interface.js.map