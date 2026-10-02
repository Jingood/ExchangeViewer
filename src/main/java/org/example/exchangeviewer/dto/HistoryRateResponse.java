package org.example.exchangeviewer.dto;

import java.time.LocalDateTime;

public record HistoryRateResponse(
        String basePrice,
        LocalDateTime createdAt
) {}
