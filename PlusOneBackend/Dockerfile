# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy POM and prefetch dependencies (faster Docker builds)
COPY pom.xml .
RUN mvn -q -B -DskipTests dependency:go-offline

# Copy source and build the jar
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---------- Run stage ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Render provides $PORT; Spring must bind to it (see application.properties)
ENV PORT=8080
EXPOSE 8080

# Copy the built JAR file
COPY --from=build /app/target/*.jar app.jar

# Start the app
CMD ["java", "-jar", "/app/app.jar"]
