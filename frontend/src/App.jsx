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
  const [timeRange, setTimeRange] = useState('1D'); // 기본값 1일
  const [isUp, setIsUp] = useState(true);

  const API_BASE_URL = '/api/v1/exchange-rates';

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
          let price = parseFloat(item.basePrice);

          // JPY 100엔 기준 정규화 방어 로직
          if (selectedCurrency === 'JPY' && price < 100) {
            price = price * 100;
          }

          return {
            ...item,
            basePrice: price,
            timestamp: new Date(item.createdAt).getTime()
          };
        }).reverse(); // 과거 -> 현재 오름차순

        setHistoryData(formattedData);
      } catch (error) {
        console.error('환율 기록 로딩 오류:', error);
      }
    };
    fetchHistoryData();
  }, [selectedCurrency]);

  // 3. 선택된 기간(timeRange)에 맞게 데이터 그룹핑 및 필터링
  const displayData = useMemo(() => {
    if (historyData.length === 0) return [];

    const now = new Date();
    let filtered = [];

    if (timeRange === '1D') {
      // 1일: 당일 00:00 부터 현재까지 (5분 단위 원본 유지)
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      filtered = historyData
          .filter(d => d.timestamp >= startOfDay)
          .map(d => {
            const date = new Date(d.timestamp);
            return {
              ...d,
              displayLabel: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
            };
          });

    } else {
      // 1개월 & 1년: 일별(Day) 평균값으로 데이터 압축 (Grouping)
      const daysToSubtract = timeRange === '1M' ? 30 : 365;
      const startTime = now.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000);

      const rawFiltered = historyData.filter(d => d.timestamp >= startTime);

      const grouped = rawFiltered.reduce((acc, curr) => {
        const date = new Date(curr.timestamp);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        if (!acc[dateKey]) {
          acc[dateKey] = { sum: 0, count: 0, timestamp: curr.timestamp };
        }
        acc[dateKey].sum += curr.basePrice;
        acc[dateKey].count += 1;
        return acc;
      }, {});

      filtered = Object.keys(grouped).sort().map(key => {
        const avgPrice = grouped[key].sum / grouped[key].count;
        const date = new Date(grouped[key].timestamp);

        return {
          basePrice: avgPrice,
          timestamp: grouped[key].timestamp,
          displayLabel: timeRange === '1M'
              ? `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
              : `${String(date.getFullYear()).slice(2)}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
        };
      });
    }

    // 상승/하락 판별
    if (filtered.length > 1) {
      const first = filtered[0].basePrice;
      const last = filtered[filtered.length - 1].basePrice;
      setIsUp(last >= first);
    }

    return filtered;
  }, [historyData, timeRange]);

  const lastDataPoint = displayData[displayData.length - 1];

  // 1시간 탭 제외, 기획 변경 반영
  const timeFilters = [
    { id: '1D', label: '1일' },
    { id: '1M', label: '1개월' },
    { id: '1Y', label: '1년' },
  ];

  return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-8 font-sans flex flex-col items-center">
        <div className="w-full max-w-5xl space-y-8">

          <header className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Exchange Viewer</h1>
            <p className="text-gray-400">실시간 원화(KRW) 환율 대시보드</p>
          </header>

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

          <div className="bg-[#151D30] p-6 rounded-2xl border border-[#24324F] shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedCurrency} 변동 추이
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
                      dataKey="displayLabel"
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      tickLine={false}
                      minTickGap={timeRange === '1D' ? 30 : 15}
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
                      formatter={(value) => [`${value.toFixed(2)} 원`, '환율']}
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

                  {lastDataPoint && (
                      <ReferenceDot
                          x={lastDataPoint.displayLabel}
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