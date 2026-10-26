package org.example.exchangeviewer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataListResponse implements Serializable {
    private List<ChartDataResponse> rates;
}
