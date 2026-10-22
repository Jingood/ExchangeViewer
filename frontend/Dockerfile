# 1단계: Node.js를 이용한 Vite 빌드
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL


# 패키지 정보 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스코드 복사 및 빌드 (dist 폴더 생성)
COPY . .
RUN npm run build

# 2단계: Nginx를 이용한 정적 파일 서빙
FROM nginx:alpine

# Nginx의 기본 HTML 서빙 폴더에 Vite 빌드 결과물(dist) 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx가 80 포트로 백그라운드에서 실행되도록 설정
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]