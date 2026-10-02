package org.example.exchangeviewer.service;


import lombok.RequiredArgsConstructor;
import org.example.exchangeviewer.dto.HistoryRateResponse;
import org.example.exchangeviewer.repository.ExchangeRateHistoryRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExchangeRateService {

    private final StringRedisTemplate redisTemplate;
    private final ExchangeRateHistoryRepository historyRepository;

    // 1. 최신 환율
    public Map<Object, Object> getLatestRates() {
        return redisTemplate.opsForHash().entries("exchange_rate:latest");
    }

    // 2. 과거 환율 기록
    @Transactional(readOnly = true)
    public List<HistoryRateResponse> getHistoryRates(String code) {
        return historyRepository.findTop100ByCurrency_CodeOrderByCreatedAtDesc(code.toUpperCase())
                .stream()
                .map(history -> new HistoryRateResponse(
                        history.getBasePrice().toString(),
                        history.getCreatedAt()
                ))
                .toList();
    }
}
