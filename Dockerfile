# 1단계: 빌드 환경 (JDK 필요)
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

# 그래들 래퍼와 설정 파일 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# gradlew 실행 권한 부여 및 빌드 (테스트 제외로 속도 향상)
RUN chmod +x ./gradlew
RUN ./gradlew clean build -x test

# 2단계: 실행 환경 (가벼운 JRE만 포함하여 용량 극소화)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 타임존 설정을 위해 tzdata 설치 (한국 시간 적용)
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone

# 빌드된 jar 파일만 가져오기
COPY --from=builder /build/build/libs/*-SNAPSHOT.jar app.jar

# 컨테이너 실행 시 작동할 명령어
ENTRYPOINT ["java", "-jar", "app.jar"]