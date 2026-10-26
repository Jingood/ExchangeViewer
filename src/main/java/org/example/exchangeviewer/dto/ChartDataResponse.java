package org.example.exchangeviewer.dto;


import java.io.Serializable;

public record ChartDataResponse(String displayLabel, Double basePrice, Long timestamp) implements Serializable {
}
