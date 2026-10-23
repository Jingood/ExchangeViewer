package org.example.exchangeviewer.service;


import lombok.RequiredArgsConstructor;
import org.example.exchangeviewer.domain.Currency;
import org.example.exchangeviewer.domain.ExchangeRateHistory;
import org.example.exchangeviewer.dto.HistoryRateResponse;
import org.example.exchangeviewer.repository.CurrencyRepository;
import org.example.exchangeviewer.repository.ExchangeRateHistoryRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExchangeRateService {

    private final StringRedisTemplate redisTemplate;
    private final ExchangeRateHistoryRepository historyRepository;
    private final CurrencyRepository currencyRepository;

    // 1. 최신 환율
    public Map<Object, Object> getLatestRates() {
        return redisTemplate.opsForHash().entries("exchange_rate:latest");
    }

    // 2. 과거 환율 기록
    @Cacheable(value = "exchangeHistory", key = "#code")
    @Transactional(readOnly = true)
    public List<HistoryRateResponse> getHistoryRates(String code) {
        Currency currency = currencyRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid currency code"));

        LocalDateTime oneYearAgo = LocalDateTime.now().minusYears(1);

        List<ExchangeRateHistory> history = historyRepository
                .findByCurrencyAndCreatedAtAfterOrderByCreatedAtDesc(currency, oneYearAgo);

        return history.stream().map(HistoryRateResponse::new).toList();
    }
}
