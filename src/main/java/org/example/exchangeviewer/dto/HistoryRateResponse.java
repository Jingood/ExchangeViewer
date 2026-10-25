package org.example.exchangeviewer.dto;

import org.example.exchangeviewer.domain.ExchangeRateHistory;

import java.io.Serializable;
import java.time.LocalDateTime;

public record HistoryRateResponse(
        String basePrice,
        LocalDateTime createdAt
) implements Serializable {
    public HistoryRateResponse(ExchangeRateHistory entity) {
        this(
                entity.getBasePrice().toString(),
                entity.getCreatedAt()
        );
    }
}
