# CS4278-Group11 (Plus One)
Upon graduating and moving to an unfamiliar city, it is hard to find people with commonalities. Plus One platformizes new Vanderbilt graduates so alumni can reach out to one another, find roommates, share opportunities, and discover events. Graduates complete onboarding, then use discovery, search, and filtering to connect with peers.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Java 17 + Spring Boot
- Database: MongoDB

## Start the backend (API)
1) Open a terminal in the project root.  
2) Run:
   ```bash
   cd PlusOneBackend
   chmod +x mvnw   # one-time on macOS/Linux
   ./mvnw spring-boot:run
   ```
3) The API will run at http://localhost:8080.
4) If you see an error about missing `.mvn/wrapper` files, run this once inside `PlusOneBackend`, then start again:
   ```bash
   mvn -N io.takari:maven:wrapper
   ./mvnw spring-boot:run
   ```

## Start the frontend (web app)
1) Open a second terminal in the project root.  
2) Use a current Node version, then install and start:
   ```bash
   cd plusone
   nvm use 20
   rm -rf node_modules
   npm install
   npm run dev
   ```
3) The site will run at http://localhost:5173. Keep the backend running in the other terminal.

## Run tests (optional)
- Backend tests:
  ```bash
  cd PlusOneBackend
  ./mvnw test
  ```
- Frontend tests:
  ```bash
  cd plusone
  npm test
  ```
  
## Deployment (frontend and backend)
- **Backend**
  1) Follow steps to set up on Render using their guide, "Deploying on Render."
  2) Add these environment variables in your Render (or other host) settings:
     - `APP_CORS_ALLOWED_ORIGINS`
     - `JWT_SECRET`
     - `MAIL_FROM`
     - `MAIL_HOST`
     - `MAIL_PASSWORD`
     - `MAIL_PORT`
     - `MAIL_USERNAME`
     - `SPRING_DATA_MONGODB_URI` (use your MongoDB connection string)
  3) Turn on automatic deploys from GitHub (e.g., in Render: connect this repo, pick the main branch, and enable “Auto Deploy” so every push to GitHub redeploys the backend).

- **Frontend**
  1) Follow step to set up deployment using Vercel and their guide to do deployments through github.
  2) Deploy the `plusone/dist` folder to your host Vercel. Set `VITE_API_BASE_URL` to your deployed backend URL (for example `https://your-api.example.com/api`).
  3) Turn on automatic deploys from GitHub (connect this repo, pick the main branch, and enable auto deploy so each push rebuilds and ships the frontend).
