import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine
} from 'recharts';

function App() {
  const [latestRates, setLatestRates] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [historyData, setHistoryData] = useState([]);
  const [isUp, setIsUp] = useState(true); // 상승/하락 상태 구분

  const API_BASE_URL = 'http://localhost:8080/api/v1/exchange-rates';

  useEffect(() => {
    const fetchLatestRates = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/latest`);
        setLatestRates(response.data);
      } catch (error) {
        console.error('최신 환율을 불러오는 중 오류 발생:', error);
      }
    };
    fetchLatestRates();
  }, []);

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/history/${selectedCurrency}`);

        // 1. 시간 순서 바로잡기 및 날짜(어제/오늘) 구분 가공
        const formattedData = response.data.map((item, index, arr) => {
          const date = new Date(item.createdAt);
          const hour = String(date.getHours()).padStart(2, '0');
          const minute = String(date.getMinutes()).padStart(2, '0');

          // 단순 시간 외에 '어제', '오늘'을 붙여 흐름을 명확하게 파악
          const today = new Date();
          const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
          const datePrefix = isToday ? '오늘' : '어제';

          return {
            ...item,
            timeLabel: `${datePrefix} ${hour}:${minute}`,
            basePrice: parseFloat(item.basePrice),
            rawDate: date // 시간 계산용
          };
        }).reverse(); // 🌟 과거에서 미래(현재) 순서로 흐르도록 배열 순서 변경! (UX 오류 해결)

        // 2. 올라가는 추세인지, 내려가는 추세인지 판별 (첫 데이터 대비 마지막 데이터 비교)
        if (formattedData.length > 1) {
          const first = formattedData[0].basePrice;
          const last = formattedData[formattedData.length - 1].basePrice;
          setIsUp(last >= first);
        }

        setHistoryData(formattedData);
      } catch (error) {
        console.error('환율 기록을 불러오는 중 오류 발생:', error);
      }
    };
    fetchHistoryData();
  }, [selectedCurrency]);

  // 마지막(현재) 데이터 포인트 구하기
  const lastDataPoint = historyData[historyData.length - 1];

  return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* 헤더 섹션 */}
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Exchange Viewer</h1>
            <p className="text-gray-400">실시간 원화(KRW) 환율 모니터링 대시보드</p>
          </header>

          {/* 최신 환율 카드 섹션 (다크 모드 & 네온 보더 효과) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['USD', 'EUR', 'JPY'].map((currency) => {
              const isSelected = selectedCurrency === currency;
              return (
                  <div
                      key={currency}
                      onClick={() => setSelectedCurrency(currency)}
                      className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border bg-[#151D30] 
                  ${isSelected
                          ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] transform -translate-y-1'
                          : 'border-[#24324F] hover:border-gray-500'}`}
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-400">{currency}</h2>
                      {isSelected && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />}
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {latestRates[currency] ? parseFloat(latestRates[currency]).toFixed(2) : '로딩중...'}
                  </span>
                      <span className="text-sm text-gray-400 font-medium mb-1">KRW</span>
                    </div>
                  </div>
              );
            })}
          </div>

          {/* 차트 섹션 (네온 그라데이션 차트 적용) */}
          <div className="bg-[#151D30] p-6 rounded-2xl border border-[#24324F] shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {selectedCurrency} 환율 변동 추이
                <span className="text-xs font-normal text-gray-400 ml-2">(최근 100건)</span>
              </h3>

              {/* 상승/하락에 따른 컬러풀한 상태 배지 */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 
              ${isUp ? 'bg-red-950/50 text-red-400 border border-red-900' : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900'}`}
              >
              <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-red-400' : 'bg-emerald-400'}`} />
                {isUp ? '상승세 (Red)' : '하락세 (Green)'}
            </span>
            </div>

            <div className="h-96 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    {/* 상승세일 땐 붉은 그라데이션, 하락세일 땐 초록 그라데이션 */}
                    <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? '#EF4444' : '#10B981'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isUp ? '#EF4444' : '#10B981'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24324F" />
                  <XAxis
                      dataKey="timeLabel"
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      tickLine={false}
                      minTickGap={40}
                      dy={10}
                  />
                  <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      tickLine={false}
                      width={70}
                  />
                  <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#9CA3AF', fontWeight: 'bold' }}
                      itemStyle={{ color: '#F3F4F6' }}
                      formatter={(value) => [`${value} 원`, '환율']}
                  />

                  {/* 차트 실선 및 음영 구역 */}
                  <Area
                      type="monotone"
                      dataKey="basePrice"
                      stroke={isUp ? '#EF4444' : '#10B981'}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#chartColor)"
                  />

                  {/* 마지막 현재 시점(최우측) 데이터에 네온 포인터 Dot 및 '현재' 표시선 추가 */}
                  {lastDataPoint && (
                      <ReferenceDot
                          x={lastDataPoint.timeLabel}
                          y={lastDataPoint.basePrice}
                          r={5}
                          fill={isUp ? '#EF4444' : '#10B981'}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                          isFront={true}
                      />
                  )}
                </AreaChart>
              </ResponsiveContainer>

              {/* 최우측 '현재(LIVE)' 배지 레이어 */}
              {lastDataPoint && (
                  <div className="absolute right-2 top-2 flex items-center gap-1.5 bg-[#0B0F19]/80 border border-[#24324F] px-2.5 py-1 rounded-md text-[11px] font-bold text-gray-300">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isUp ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    LIVE (현재)
                  </div>
              )}
            </div>
          </div>

        </div>
      </div>
  );
}

export default App;