# CS4278-Group11
Vanderbilt CS 4278 Team 11 Software Engineering Project

## Project Summary
It is a commonly referenced struggle that, upon graduating and moving to an unfamiliar city, it is hard to find people with commonalities to connect with. Plus One aims to help alleviate that issue by platforming new Vanderbilt graduates in one accessible spot so that people with this common background can reach out to one another. Through this process, people can make friendships, find a roommate, share work and internship opportunities, and even find a friend to join for a day trip. 

Plus One provides a variety of tools and user experiences to help Vanderbilt alumni connect with each other. In our app, graduates will complete a profile onboarding experience then be directed to a discovery page which they can access at any time to see activities and events in their area being posted. Our app incorporates search functionality and filtering mechanisms so that users can find other alumni with common interests. The scope of the project, ultimately, is to provide Vandy alumni with one central platform to casual connections beyond graduation. 

## Framework
Front End: JavaScript + React 
Backend: Spring Boot + Java 
Database: Mongo DB

## Backend Prereqs
- **Java 17** (already assumed installed)
- **No need to install Maven** — we use the Maven Wrapper (`./mvnw`)

## Run the backend

```bash
cd PlusOneBackend
# First time build (downloads deps)
./mvnw spring-boot:run
```

Spring Boot will start on http://localhost:8080. MongoDB defaults to `localhost:27017`. You can override in `src/main/resources/application.properties`:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/plusone
spring.application.name=PlusOneBackend
server.port=8080
```

Set up instructions:

```bash
git clone <REPO_URL>
cd CS4278-Group11/PlusOneBackend
./mvnw spring-boot:run
```

## Useful Maven commands

```bash
./mvnw clean test
./mvnw spring-boot:run
./mvnw clean package
```

## Frontend Prereqs
- **Node.js**
You can install the latest Long Term Support (LTS) version of Node.js:
```bash
nvm install --lts
```

Alternatively, to install a specific version:
```bash
nvm install <version_number> # e.g., nvm install 18
```

Check the installed Node.js and npm versions:
```bash
node -v
npm -v
```

## Run the frontend
First time:

```bash
cd plusone
npm install
npm run dev
```
npm install sets up the dependencies

Running after setup: 
```bash
cd plusone
npm run dev
```

This will give you a locally hosted front end. You need to run both front end and backend on separate terminals to access login features. 
