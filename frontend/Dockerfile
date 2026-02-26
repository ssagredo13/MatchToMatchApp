FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install
RUN npm install -D tailwindcss postcss autoprefixer
RUN npm install react-leaflet leaflet lucide-react react-router-dom axios sonner
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]