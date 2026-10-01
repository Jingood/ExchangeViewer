package org.example.exchangeviewer.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.exchangeviewer.domain.Currency;
import org.example.exchangeviewer.domain.ExchangeRateHistory;
import org.example.exchangeviewer.repository.CurrencyRepository;
import org.example.exchangeviewer.repository.ExchangeRateHistoryRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateScheduler {

    private final CurrencyRepository currencyRepository;
    private final ExchangeRateHistoryRepository historyRepository;
    private final StringRedisTemplate redisTemplate;

    private final RestClient restClient = RestClient.create();

    public record ExChangeRateResponse(Map<String, Double> rates) {}

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void fetchAndSaveExchangeRates() {
        log.info("환율 데이터 수집을 시작합니다.");

        try {
            String apiUrl = "https://open.er-api.com/v6/latest/KRW";

            ExChangeRateResponse response = restClient.get()
                    .uri(apiUrl)
                    .retrieve()
                    .body(ExChangeRateResponse.class);

            if (response == null || response.rates() == null) {
                log.error("API 응답이 비어있거나 형식이 맞지 않습니다.");
                return;
            }

            Map<String, Double> rates = response.rates();

            String[] targetCodes = {"USD", "EUR", "JPY"};

            for (String code : targetCodes) {
                if (rates.containsKey(code)) {
                    double inverseRate = 1 / rates.get(code);
                    BigDecimal currentPrice = BigDecimal.valueOf(inverseRate);

                    Currency currency = currencyRepository.findByCode(code)
                            .orElseGet(() -> {
                                Currency newCurrency = new Currency();
                                newCurrency.setCode(code);
                                newCurrency.setName(code);
                                return currencyRepository.save(newCurrency);
                            });

                    ExchangeRateHistory history = new ExchangeRateHistory();
                    history.setCurrency(currency);
                    history.setBasePrice(currentPrice);
                    historyRepository.save(history);

                    redisTemplate.opsForHash().put("exchange_rate:latest", code, currentPrice.toString());
                }
            }

            log.info("환율 데이터 수집 및 Redis 갱신 완료");
        } catch (Exception e) {
            log.error("환율 수집 중 에러 발생: {}", e.getMessage());
        }
    }
}
