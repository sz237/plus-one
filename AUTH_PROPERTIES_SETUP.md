# Team Setup - Authentication System

## Quick Setup for Teammates

### 1. Pull Latest Changes
```bash
git pull origin main
```

### 2. Configure Your MongoDB Connection

Create this file: `PlusOneBackend/src/main/resources/application.properties`

```properties
spring.application.name=PlusOneBackend

# Replace with YOUR MongoDB Atlas credentials
spring.data.mongodb.uri=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority&appName=YOUR_CLUSTER_NAME
spring.data.mongodb.database=plusone

server.port=8080
```

**Get your connection string from MongoDB Atlas:**
1. Go to your cluster
2. Click "Connect" → "Connect your application"
3. Copy the connection string
4. Replace `<password>` and `<cluster-url>` with your actual values

### 3. Start the Backend
```bash
cd PlusOneBackend
./mvnw spring-boot:run
```

### 4. Start the Frontend
```bash
cd plusone
npm install
npm run dev
```