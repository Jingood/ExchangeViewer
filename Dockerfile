# 1단계: 빌드 환경 (JDK 25 적용)
FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /build

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

RUN chmod +x ./gradlew
RUN ./gradlew clean build -x test

# 2단계: 실행 환경 (JRE 25 적용)
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone

COPY --from=builder /build/build/libs/*-SNAPSHOT.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]