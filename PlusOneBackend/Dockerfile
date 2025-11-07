# ---------- Build stage ----------
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy the backend project
COPY . .

# Ensure the Maven wrapper is executable
RUN chmod +x mvnw

# Build the JAR (skip tests for speed)
RUN ./mvnw -DskipTests package

# ---------- Run stage ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the built JAR file
COPY --from=build /app/target /app/target

# Set Render port
ENV PORT=8080
EXPOSE 8080

# Run Spring Boot
CMD ["/bin/sh", "-lc", "java -Dserver.port=${PORT} -jar /app/target/*.jar"]
