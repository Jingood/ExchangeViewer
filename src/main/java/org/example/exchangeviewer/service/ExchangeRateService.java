package org.example.exchangeviewer.service;


import lombok.RequiredArgsConstructor;
import org.example.exchangeviewer.domain.Currency;
import org.example.exchangeviewer.domain.ExchangeRateHistory;
import org.example.exchangeviewer.dto.ChartDataListResponse;
import org.example.exchangeviewer.dto.ChartDataResponse;
import org.example.exchangeviewer.dto.HistoryRateListResponse;
import org.example.exchangeviewer.dto.HistoryRateResponse;
import org.example.exchangeviewer.repository.CurrencyRepository;
import org.example.exchangeviewer.repository.ExchangeRateHistoryRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

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
    @Cacheable(value = "exchangeHistory", key = "#code + '_' + #range")
    @Transactional(readOnly = true)
    public ChartDataListResponse getChartData(String code, String range) {
        Currency currency = currencyRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Invalid currency code"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = switch (range) {
            case "1M" -> now.minusDays(30);
            case "1Y" -> now.minusDays(365);
            default -> now.toLocalDate().atStartOfDay();
        };

        List<ExchangeRateHistory> history = historyRepository
                .findByCurrencyAndCreatedAtAfterOrderByCreatedAtDesc(currency, startTime);

        List<ExchangeRateHistory> ascendingHistory = new ArrayList<>(history);
        Collections.reverse(ascendingHistory);

        List<ChartDataResponse> result = new ArrayList<>();

        if ("1D".equals(range)) {
            for (ExchangeRateHistory h : ascendingHistory) {
                double price = h.getBasePrice().doubleValue();
                if ("JPY".equals(code) && price < 100) price *= 100;

                String label = String.format("%02d:%02d", h.getCreatedAt().getHour(), h.getCreatedAt().getMinute());
                long timestamp = h.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
                result.add(new ChartDataResponse(label, price, timestamp));
            }
        } else {
            Map<LocalDate, List<ExchangeRateHistory>> grouped = ascendingHistory.stream()
                    .collect(Collectors.groupingBy(h -> h.getCreatedAt().toLocalDate(), TreeMap::new, Collectors.toList()));

            for (Map.Entry<LocalDate, List<ExchangeRateHistory>> entry : grouped.entrySet()) {
                LocalDate date = entry.getKey();
                double avgPrice = entry.getValue().stream()
                        .mapToDouble(h -> {
                            double p = h.getBasePrice().doubleValue();
                            return ("JPY".equals(code) && p < 100) ? p * 100 : p;
                        })
                        .average().orElse(0.0);

                String label = "1M".equals(range)
                        ? String.format("%02d/%02d", date.getMonthValue(), date.getDayOfMonth())
                        : String.format("%02d/%02d/%02d", date.getYear() % 100, date.getMonthValue(), date.getDayOfMonth());

                long timestamp = date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
                result.add(new ChartDataResponse(label, avgPrice, timestamp));
            }
        }
        return new ChartDataListResponse(result);
    }
}
