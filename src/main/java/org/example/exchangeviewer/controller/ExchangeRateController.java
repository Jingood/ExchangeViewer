package org.example.exchangeviewer.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.exchangeviewer.dto.HistoryRateResponse;
import org.example.exchangeviewer.service.ExchangeRateBackfillService;
import org.example.exchangeviewer.service.ExchangeRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@Tag(name = "환율 API", description = "실시간 환율 및 시계역 기록 조회 API")
@RestController
@RequestMapping("/api/v1/exchange-rates")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;
    private final ExchangeRateBackfillService backfillService;

    @Operation(summary = "전체 최신 환율 조회", description = "메인 페이지용. DB 접근 없이 Redis에서 초고속으로 가져옵니다.")
    @GetMapping("/latest")
    public ResponseEntity<Map<Object, Object>> getLatestRates() {
        return ResponseEntity.ok(exchangeRateService.getLatestRates());
    }

    @Operation(summary = "특정 통화 환율 기록 조회", description = "차트 렌더링을 위해 특정 통화(예: USD)의 최근 100건 기록을 반환합니다.")
    @GetMapping("/history/{code}")
    public ResponseEntity<List<HistoryRateResponse>> getHistoryRates(
            @Parameter(description = "통화 코드 (ex: USD, EUR)", example = "USD")
            @PathVariable String code) {
        return ResponseEntity.ok(exchangeRateService.getHistoryRates(code));
    }

    @Operation(summary = "5년 치 과거 환율 데이터 마이그레이션", description = "Frankfurter API를 호출하여 과거 5년 치 일별 환율 데이터를 DB에 일괄 적재(Backfill)합니다. (최초 1회만 실행 권장)")
    @PostMapping("/backfill")
    public ResponseEntity<String> runBackfill() {
        return ResponseEntity.ok(backfillService.backfill5YearData());
    }
}
