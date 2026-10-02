package org.example.exchangeviewer.repository;

import org.example.exchangeviewer.domain.ExchangeRateHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExchangeRateHistoryRepository extends JpaRepository<ExchangeRateHistory, Long> {
    List<ExchangeRateHistory> findTop100ByCurrency_CodeOrderByCreatedAtDesc(String code);
}
