package org.example.exchangeviewer.repository;

import org.example.exchangeviewer.domain.ExchangeRateHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExchangeRateHistoryRepository extends JpaRepository<ExchangeRateHistory, Long> {
}
