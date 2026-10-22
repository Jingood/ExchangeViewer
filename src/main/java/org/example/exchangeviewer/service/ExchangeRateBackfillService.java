package org.example.exchangeviewer.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ExchangeRateBackfillService {
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate = new RestTemplate();

    public ExchangeRateBackfillService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public String backfill5YearData() {
        String[] currencies = {"USD", "EUR", "JPY"};
        String endDate = LocalDate.now().toString();
        String startDate = LocalDate.now().minusYears(5).toString();
        int totalInserted = 0;

        for (String currency : currencies) {
            String url = String.format("https://api.frankfurter.app/%s..%s?from=%s&to=KRW", startDate, endDate, currency);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("rates")) {
                Map<String, Map<String, Double>> rates = (Map<String, Map<String, Double>>) response.get("rates");
                List<Object[]> batchArgs = new ArrayList<>();

                for (Map.Entry<String, Map<String, Double>> entry : rates.entrySet()) {
                    String dateStr = entry.getKey();
                    Double rate = entry.getValue().get("KRW");

                    if (rate != null) {
                        if (currency.equals("JPY") && rate < 100) rate = rate * 100;

                        batchArgs.add(new Object[]{currency, rate, dateStr + " 00:00:00"});
                    }
                }

                String sql = "INSERT INTO exchange_rate_history (currency_id, base_price, created_at) " +
                        "VALUES ((SELECT id FROM currency WHERE code = ?), ?, CAST(? AS TIMESTAMP))";
                jdbcTemplate.batchUpdate(sql, batchArgs);
                totalInserted += batchArgs.size();
            }
        }
        return "데이터 마이그레이션 완료: 총 " + totalInserted + "건의 5년 치 환율 데이터가 적재되었습니다.";
    }

}
