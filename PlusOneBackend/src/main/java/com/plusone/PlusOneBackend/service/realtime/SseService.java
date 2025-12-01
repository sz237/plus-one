package com.plusone.PlusOneBackend.service.realtime;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Simple in-memory SSE hub keyed by userId.
 */
@Service
public class SseService {

    // 0L = no timeout; rely on client reconnect + heartbeat to keep alive through proxies.
    private static final long DEFAULT_TIMEOUT = 0L;

    private final Map<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final AtomicLong eventId = new AtomicLong();

    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);

        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));

        trySend(emitter, "connected", "ok");

        return emitter;
    }

    public void sendToUsers(Collection<String> userIds, String event, Object data) {
        for (String userId : userIds) {
            send(userId, event, data);
        }
    }

    public void send(String userId, String event, Object data) {
        Set<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) {
            return;
        }

        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(event)
                        .id(String.valueOf(eventId.incrementAndGet()))
                        .data(data));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        dead.forEach(emitter -> removeEmitter(userId, emitter));
    }

    private void trySend(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
        } catch (IOException ignored) {
        }
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        Set<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
        }
    }

    @Scheduled(fixedRateString = "${app.sse.heartbeat-ms:20000}")
    public void sendHeartbeats() {
        emitters.forEach((userId, userEmitters) -> {
            List<SseEmitter> dead = new ArrayList<>();
            for (SseEmitter emitter : userEmitters) {
                try {
                    emitter.send(SseEmitter.event().name("heartbeat").data("ping"));
                } catch (IOException e) {
                    dead.add(emitter);
                }
            }
            dead.forEach(emitter -> removeEmitter(userId, emitter));
        });
    }
}
