FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Instalar dependencias
COPY package*.json ./
RUN npm install

RUN mkdir -p uploads

# Copiar el resto del código
COPY . .

# Exponer el puerto de la app
EXPOSE 3000

# Comando para desarrollo (usa nodemon si lo instalas después)
CMD ["node", "src/app.js"]