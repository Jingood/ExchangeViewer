package org.example.exchangeviewer.dto;

import org.example.exchangeviewer.domain.ExchangeRateHistory;

import java.time.LocalDateTime;

public record HistoryRateResponse(
        String basePrice,
        LocalDateTime createdAt
) {
    public HistoryRateResponse(ExchangeRateHistory entity) {
        this(
                entity.getBasePrice().toString(),
                entity.getCreatedAt()
        );
    }
}
