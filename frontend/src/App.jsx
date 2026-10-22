import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';

function App() {
  const [latestRates, setLatestRates] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [historyData, setHistoryData] = useState([]);

  // 새로 추가된 기간 필터 상태 (기본값 1일)
  const [timeRange, setTimeRange] = useState('1D');

  const [isUp, setIsUp] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/exchange-rates';

  // 1. 최신 환율 폴링 (메인 카드용)
  useEffect(() => {
    const fetchLatestRates = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/latest`);
        setLatestRates(response.data);
      } catch (error) {
        console.error('최신 환율 로딩 오류:', error);
      }
    };
    fetchLatestRates();
  }, []);

  // 2. 과거 환율 기록 로딩 및 정규화
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/history/${selectedCurrency}`);

        const formattedData = response.data.map(item => {
          const date = new Date(item.createdAt);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hour = String(date.getHours()).padStart(2, '0');
          const minute = String(date.getMinutes()).padStart(2, '0');

          let price = parseFloat(item.basePrice);

          // [트러블슈팅] JPY 구형 데이터(1엔 기준)가 들어올 경우 100엔 기준으로 정규화 방어 로직
          if (selectedCurrency === 'JPY' && price < 100) {
            price = price * 100;
          }

          return {
            ...item,
            // [트러블슈팅] 어제/오늘 모호함을 없애고 MM/DD HH:mm 절대 시간 적용
            timeLabel: `${month}/${day} ${hour}:${minute}`,
            basePrice: price,
            timestamp: date.getTime()
          };
        }).reverse(); // 시간 오름차순 (과거 -> 현재)

        setHistoryData(formattedData);
      } catch (error) {
        console.error('환율 기록 로딩 오류:', error);
      }
    };
    fetchHistoryData();
  }, [selectedCurrency]);

  // 3. 선택된 기간(timeRange)에 맞게 데이터 잘라내기
  const displayData = useMemo(() => {
    if (historyData.length === 0) return [];

    let filtered = historyData;
    if (timeRange === '1H') {
      // 5분 주기이므로 1시간 = 최근 12개 데이터
      filtered = historyData.slice(-12);
    } else if (timeRange === '1D') {
      // 1일 = 최대 288개 (현재 백엔드 limit이 100이므로 사실상 전체 표기)
      filtered = historyData.slice(-288);
    }
    // '1M', '1Y'는 추후 백엔드 API 추가 시 분기 처리 (현재는 가진 데이터 전체 렌더링)

    // 상승/하락 판별 (보여지는 그래프의 첫 점과 끝 점 기준)
    if (filtered.length > 1) {
      const first = filtered[0].basePrice;
      const last = filtered[filtered.length - 1].basePrice;
      setIsUp(last >= first);
    }

    return filtered;
  }, [historyData, timeRange]);

  const lastDataPoint = displayData[displayData.length - 1];

  // 기간 필터 메뉴 구성
  const timeFilters = [
    { id: '1H', label: '1시간' },
    { id: '1D', label: '1일' },
    { id: '1M', label: '1개월' },
    { id: '1Y', label: '1년' },
  ];

  return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-8 font-sans flex flex-col items-center">
        <div className="w-full max-w-5xl space-y-8">

          {/* 헤더 */}
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Exchange Viewer</h1>
            <p className="text-gray-400">실시간 원화(KRW) 환율 대시보드</p>
          </header>

          {/* 상단 최신 환율 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['USD', 'EUR', 'JPY'].map((currency) => {
              const isSelected = selectedCurrency === currency;
              return (
                  <div
                      key={currency}
                      onClick={() => setSelectedCurrency(currency)}
                      className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border bg-[#151D30] relative overflow-hidden
                  ${isSelected
                          ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] transform -translate-y-1'
                          : 'border-[#24324F] hover:border-gray-500'}`}
                  >
                    {isSelected && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />}
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-400">{currency}</h2>
                      {isSelected && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />}
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {latestRates[currency] ? parseFloat(latestRates[currency]).toFixed(2) : '---'}
                  </span>
                      <span className="text-sm text-gray-400 font-medium mb-1">KRW</span>
                    </div>
                  </div>
              );
            })}
          </div>

          {/* 차트 영역 */}
          <div className="bg-[#151D30] p-6 rounded-2xl border border-[#24324F] shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedCurrency} 변동 추이
                  {/* 👇 필터링되어 차트에 그려지는 실제 데이터 개수 표시 */}
                  <span className="text-xs font-normal text-gray-500 bg-[#1E293B] px-2 py-0.5 rounded-md">
                    {displayData.length}건
                  </span>
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 
                ${isUp ? 'bg-red-950/60 text-red-400 border border-red-900/50' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50'}`}
                >
                {isUp ? '▲ 상승' : '▼ 하락'}
              </span>
              </div>

              {/* 기간 필터 탭 UI */}
              <div className="flex bg-[#0B0F19] p-1 rounded-lg border border-[#24324F]">
                {timeFilters.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setTimeRange(filter.id)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                            timeRange === filter.id
                                ? 'bg-[#1E293B] text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                      {filter.label}
                    </button>
                ))}
              </div>
            </div>

            <div className="h-[400px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? '#EF4444' : '#10B981'} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={isUp ? '#EF4444' : '#10B981'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis
                      dataKey="timeLabel"
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      tickLine={false}
                      minTickGap={50}
                      dy={10}
                  />
                  <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      tickLine={false}
                      width={70}
                  />
                  <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                      itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                      formatter={(value) => [`${value} 원`, '환율']}
                  />

                  <Area
                      type="monotone"
                      dataKey="basePrice"
                      stroke={isUp ? '#EF4444' : '#10B981'}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#chartColor)"
                      animationDuration={700}
                  />

                  {/* 현재 시점 Dot */}
                  {lastDataPoint && (
                      <ReferenceDot
                          x={lastDataPoint.timeLabel}
                          y={lastDataPoint.basePrice}
                          r={5}
                          fill={isUp ? '#EF4444' : '#10B981'}
                          stroke="#151D30"
                          strokeWidth={2}
                          isFront={true}
                      />
                  )}
                </AreaChart>
              </ResponsiveContainer>

              {/* LIVE 배지 */}
              {lastDataPoint && (
                  <div className="absolute right-2 top-2 flex items-center gap-1.5 bg-[#0B0F19]/90 border border-[#24324F] px-2.5 py-1 rounded-md text-xs font-bold text-gray-300 shadow-lg">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isUp ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    현재 (LIVE)
                  </div>
              )}
            </div>
          </div>

        </div>
      </div>
  );
}

export default App;