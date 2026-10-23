package org.example.exchangeviewer.repository;

import org.example.exchangeviewer.domain.Currency;
import org.example.exchangeviewer.domain.ExchangeRateHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ExchangeRateHistoryRepository extends JpaRepository<ExchangeRateHistory, Long> {
    List<ExchangeRateHistory> findByCurrencyAndCreatedAtAfterOrderByCreatedAtDesc(Currency currency, LocalDateTime createdAt);
}
